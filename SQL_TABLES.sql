CREATE TABLE pastes (
    id SERIAL NOT NULL,
    title VARCHAR(50),
    text text NOT NULL,
    date TIMESTAMP DEFAULT NOW()
)

DROP TABLE pastes;