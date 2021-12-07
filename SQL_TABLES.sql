CREATE TABLE pastes (
    id SERIAL NOT NULL,
    title VARCHAR(50),
    text text NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
  	PRIMARY KEY (id)
)

DROP TABLE pastes;

CREATE TABLE comments (
    comment_id SERIAL NOT NULL,
	paste_id int NOT NULL,
    text text NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk__comments__pastes 
      FOREIGN KEY (paste_id)
      REFERENCES pastes (id)
      ON DELETE CASCADE
)

DROP TABLE comments;