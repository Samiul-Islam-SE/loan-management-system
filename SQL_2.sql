ALTER TABLE loans
ADD COLUMN borrower_email CITEXT,
ADD COLUMN lender_email CITEXT;

CREATE OR REPLACE FUNCTION populate_loan_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Get borrower email
  SELECT email INTO NEW.borrower_email
  FROM users
  WHERE id = NEW.borrower_id;

  -- Get lender email
  SELECT email INTO NEW.lender_email
  FROM users
  WHERE id = NEW.lender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before insert
CREATE TRIGGER trg_populate_loan_emails
BEFORE INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION populate_loan_emails();

-- Optional: Backfill existing data for loans that might not have it
UPDATE loans l
SET
  borrower_email = (SELECT u.email FROM users u WHERE u.id = l.borrower_id),
  lender_email = (SELECT u.email FROM users u WHERE u.id = l.lender_id)
WHERE borrower_email IS NULL OR lender_email IS NULL;