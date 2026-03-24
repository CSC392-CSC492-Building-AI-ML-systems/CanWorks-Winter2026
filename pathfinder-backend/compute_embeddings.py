from sqlalchemy.orm import Session
from database import SessionLocal
from models import Job
from fastembed import TextEmbedding

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")


def compute():
    db: Session = SessionLocal()
    try:
        jobs = db.query(Job).all()
        count = 0
        for job in jobs:
            emb_current = getattr(job, 'embedding', None)
            needs_embedding = False
            if emb_current is None:
                needs_embedding = True
            else:
                try:
                    # If embedding exists but has zero length, treat as missing
                    if hasattr(emb_current, '__len__') and len(emb_current) == 0:
                        needs_embedding = True
                except Exception:
                    # In case truthiness of the embedding raises, skip treating as missing
                    needs_embedding = False

            if needs_embedding:
                text_blob = ' '.join(filter(None, [str(job.title or ''), str(job.employer or ''), str(job.description or '')]))
                try:
                    emb_vec = next(model.embed([text_blob]))
                    emb = emb_vec.tolist()
                    job.embedding = emb
                    db.add(job)
                    count += 1
                    if count % 50 == 0:
                        db.commit()
                except Exception as e:
                    print(f"Failed to compute embedding for job {job.id}: {e}")
        db.commit()
        print(f"Updated embeddings for {count} jobs")
    finally:
        db.close()


if __name__ == '__main__':
    compute()
