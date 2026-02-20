import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load the DATABASE_URL from the .env file into the environment
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# The "engine" is SQLAlchemy's connection to your database.
# Think of it as the bridge between Python and PostgreSQL.
# It manages connection pooling (reusing connections for efficiency).
engine = create_engine(DATABASE_URL)

# A "session" is a conversation with the database.
# Each API request gets its own session to read/write data,
# then the session closes when the request is done.
# sessionmaker is a factory that creates new sessions on demand.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class for all our database models.
# Any class that inherits from Base becomes a database table.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session to each request.

    Usage in a route:
        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...

    The 'yield' keyword means:
    1. Create a session and give it to the route
    2. Wait for the route to finish
    3. Close the session (the 'finally' block) to free the connection
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
