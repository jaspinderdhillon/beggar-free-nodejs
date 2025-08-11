-- Run this SQL in your MySQL database to add missing columns to the applicants table

ALTER TABLE applicants
  ADD COLUMN beggar_name VARCHAR(255),
  ADD COLUMN beggar_idproofnum VARCHAR(100),
  ADD COLUMN beggar_contact VARCHAR(50),
  ADD COLUMN beggar_city VARCHAR(100);
