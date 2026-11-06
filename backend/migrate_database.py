
import sqlite3

DATABASE_PATH = "hireai.db"

connection = sqlite3.connect(DATABASE_PATH)
cursor = connection.cursor()

try:
    # Add new columns to existing jobs table
    cursor.execute("PRAGMA table_info(jobs)")
    job_columns = [column[1] for column in cursor.fetchall()]

    if "required_skills" not in job_columns:
        cursor.execute(
            "ALTER TABLE jobs ADD COLUMN required_skills JSON NOT NULL DEFAULT '[]'"
        )

    if "preferred_skills" not in job_columns:
        cursor.execute(
            "ALTER TABLE jobs ADD COLUMN preferred_skills JSON NOT NULL DEFAULT '[]'"
        )

    if "experience" not in job_columns:
        cursor.execute(
            "ALTER TABLE jobs ADD COLUMN experience VARCHAR(100) DEFAULT ''"
        )

    # Create screening results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS screening_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            candidate_id INTEGER NOT NULL,
            final_score FLOAT NOT NULL,
            semantic_score FLOAT NOT NULL,
            required_skill_score FLOAT NOT NULL,
            preferred_skill_score FLOAT NOT NULL,
            experience_score FLOAT NOT NULL,
            result_data JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        )
    """)

    connection.commit()

    print("Database migration completed successfully!")

    cursor.execute("PRAGMA table_info(jobs)")
    print("\nUpdated jobs columns:")
    for column in cursor.fetchall():
        print(column[1])

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='screening_results'"
    )

    print("\nScreening results table:", cursor.fetchone())

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()
