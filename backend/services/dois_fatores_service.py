# Regras do 2FA do admin (TOTP): gerar o segredo/QR e conferir o código.
# Usado no login (routes/auth.py) e para confirmar ações sensíveis (promover admin).

import hmac
import time
from datetime import datetime, timedelta, timezone

import pyotp
import segno
from fastapi import HTTPException

from models.dois_fatores import DoisFatores

MAX_FALHAS = 5
MINUTOS_BLOQUEIO = 15


def _agora():
    # DateTime do MySQL não guarda fuso: tudo em UTC "ingênuo"
    return datetime.now(timezone.utc).replace(tzinfo=None)


def novo_segredo(session, usuario):
    """Cria (ou troca, enquanto ainda não foi ativado) o segredo e devolve o que a tela mostra."""
    registro = session.get(DoisFatores, usuario.id) or DoisFatores(usuario_id=usuario.id, falhas=0)
    registro.segredo = pyotp.random_base32()
    registro.ativo = False
    registro.ultimo_passo = None
    session.add(registro)
    session.commit()

    url = pyotp.TOTP(registro.segredo).provisioning_uri(name=usuario.email, issuer_name="Kivira")
    return {"segredo": registro.segredo, "otpauth_url": url, "qr_code": segno.make(url).svg_data_uri(scale=5)}


def _passo_do_codigo(segredo, codigo):
    """Passo de 30s em que o código bate (aceita 1 passo de folga pro relógio do celular), ou None."""
    totp = pyotp.TOTP(segredo)
    atual = int(time.time()) // totp.interval
    for passo in (atual - 1, atual, atual + 1):
        if hmac.compare_digest(totp.generate_otp(passo), str(codigo).strip()):
            return passo
    return None


def conferir_codigo(session, registro, codigo):
    """Levanta HTTPException se o código não vale. 5 erros seguidos bloqueiam por 15 min."""
    if registro is None:
        raise HTTPException(status_code=400, detail="2FA não configurado")
    agora = _agora()
    if registro.bloqueado_ate and registro.bloqueado_ate > agora:
        raise HTTPException(status_code=429, detail="Muitos códigos errados. Tente de novo em alguns minutos")

    passo = _passo_do_codigo(registro.segredo, codigo)
    repetido = passo is not None and registro.ultimo_passo is not None and passo <= registro.ultimo_passo
    if passo is None or repetido:
        registro.falhas = (registro.falhas or 0) + 1
        if registro.falhas >= MAX_FALHAS:
            registro.falhas = 0
            registro.bloqueado_ate = agora + timedelta(minutes=MINUTOS_BLOQUEIO)
        session.commit()
        detalhe = "Esse código já foi usado. Espere o próximo aparecer no app" if repetido else "Código inválido"
        raise HTTPException(status_code=400, detail=detalhe)

    registro.ultimo_passo = passo
    registro.falhas = 0
    registro.bloqueado_ate = None
    registro.ativo = True
    session.commit()
