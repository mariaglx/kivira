-- Respostas do questionário de feedback do professor: 4 objetivas de 1 a 5 e 1 aberta.
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id int unsigned NOT NULL,
    facilidade_uso       SMALLINT NOT NULL,
    autonomia_aluno      SMALLINT NOT NULL,
    alinhamento_conteudo SMALLINT NOT NULL,
    usaria_nas_aulas     SMALLINT NOT NULL,
    comentario           TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_feedback_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_feedback_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT ck_feedback_notas CHECK (facilidade_uso BETWEEN 1 AND 5 AND autonomia_aluno BETWEEN 1 AND 5 AND alinhamento_conteudo BETWEEN 1 AND 5 AND usaria_nas_aulas BETWEEN 1 AND 5)
);

-- Respostas do feedback do aluno: diversão de 1 a 5, as outras duas de 1 a 3.
CREATE TABLE IF NOT EXISTS feedback_aluno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id int unsigned NOT NULL,
    diversao      SMALLINT NOT NULL,
    autonomia     SMALLINT NOT NULL,
    jogar_de_novo SMALLINT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_feedback_aluno_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_feedback_aluno_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT ck_feedback_aluno_notas CHECK (diversao BETWEEN 1 AND 5 AND autonomia BETWEEN 1 AND 3 AND jogar_de_novo BETWEEN 1 AND 3)
);
