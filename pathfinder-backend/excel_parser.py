import hashlib # Python's built-in hashing library => use SHA256 to generate dedupe_hash
from datetime import datetime, date
from openpyxl import load_workbook # library to read .xlsx files
# when admin uploads an excel file via API, the file arrives as raw bytes
# BytesIO wraps the bytes so openpyxl can read them as if they were a file
from io import BytesIO


"""
This function handles the messiness of Excel dates.
Excel stores dates in 3 possible ways:
1) datetime object: call value.date() to remove the time part
2) date object: value is of desired type
3) integer: Day 1 = Dec 30, 1899. Convert by adding the integer
to the base date's day count (ordinal)
"""
def convert_excel_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)):
        try:
            return datetime.fromordinal(datetime(1899, 12, 30).toordinal() + int(value)).date()
        except Exception:
            return None
    return None

"""
This function generates the hash value to check for duplicates in the database
"""
def generate_dedupe_hash(employer, title, city):
    employer = (employer or "").lower().strip()
    title = (title or "").lower().strip()
    city = (city or "").lower().strip()
    raw = f"{employer}|{title}|{city}" # the '|' acts as the separator so that each combination of employer, title, city is unique
    return hashlib.sha256(raw.encode()).hexdigest()

def parse_excel_file(file_bytes):
    workbook = load_workbook(filename=BytesIO(file_bytes), read_only=True)
    sheet = workbook["Main"]

    jobs = []
    errors = []

    for row_num, row in enumerate(sheet.iter_rows(min_row=3, values_only=True), start=3): # skip first 2 rows of column names
        try:
            # stop parsing when hit a completely empty row
            if all(cell is None for cell in row):
                break
            
            if not row[1] or not row[3]:
                errors.append(f"Row {row_num}: Missing title or employer, skipped") # title and employer are not nullable
                continue
            majors = [row[i] for i in range(19, 24) if row[i] is not None] # column 20 to column 25 in excel files are for major specification

            with_pay_value = True
            if isinstance(row[9], str): # column 10 in excel files is for with_pay
                with_pay_value = row[9].strip().lower() == "yes"
            
            duration = None
            if row[12] is not None: # column 11 in excel files is for duration
                try:
                    duration = float(row[12])
                except (ValueError, TypeError):
                    duration = None
            
            # create the JSON of job posting
            job = {
                "title": str(row[1]).strip(),
                "posting_date": convert_excel_date(row[2]),
                "employer": str(row[3]).strip(),
                "link_to_posting": row[4],
                "application_deadline": convert_excel_date(row[5]),
                "mode": row[6],
                "job_type": row[7],
                "term": row[8],
                "with_pay": with_pay_value,
                "start_month": row[10],
                "end_month": row[11],
                "duration_months": duration,
                "province": row[13],
                "city": row[14],
                "target_audience": row[15],
                "description": row[16],
                "responsibilities": row[17],
                "requirements": row[18],
                "majors_required": majors if majors else None,
                "other_academic_requirements": row[24],
                "assets": row[25],
                "employer_notes": row[26],
                "dedupe_hash": generate_dedupe_hash(str(row[3]), str(row[1]), row[14])
            }

            # add job to list of jobs
            jobs.append(job)
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    # finish parsing
    workbook.close()
    return jobs, errors
