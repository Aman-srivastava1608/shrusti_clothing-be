-- Database schema for multi-branch
CREATE DATABASE IF NOT EXISTS multi_branch_db;
USE multi_branch_db;

-- Admins (super admin users)
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin') DEFAULT 'super_admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  branch_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_name VARCHAR(100) NOT NULL,
  address TEXT,
  gst_number VARCHAR(20),
  mobile_number VARCHAR(15),
  alternate_number VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branch Users
CREATE TABLE IF NOT EXISTS branch_users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('branch_admin','staff') DEFAULT 'branch_admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);




-- add fabric
CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_number VARCHAR(10) NOT NULL UNIQUE,
    supplier_name VARCHAR(255),
    supplier_short_name VARCHAR(10),
    invoice_no VARCHAR(50),
    date VARCHAR(10),
    weight_of_material VARCHAR(50),
    fabric_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_short_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS fabric_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    fabric_type_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);

CREATE TABLE operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);


CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  fabric_type VARCHAR(100) NOT NULL,
  operations JSON, -- Operations ko JSON format me store karenge
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);

CREATE TABLE `wages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `operation_name` VARCHAR(255) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `overlock_operator` VARCHAR(255),
  `flatlock_operator` VARCHAR(255),
  `size_wise_entry` JSON,
  `extra_pieces` INT DEFAULT 0,
  `total_pieces` INT NOT NULL,
  `gross_amount` DECIMAL(10, 2) NOT NULL,
  `deduct_advance_pay` DECIMAL(10, 2) DEFAULT 0.00,
  `payable_amount` DECIMAL(10, 2) NOT NULL,
  `payment_type` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- New columns added for separate overlock and flatlock calculations
  `overlock_gross_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `overlock_payable_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `overlock_deduct_advance` DECIMAL(10, 2) DEFAULT 0.00,
  `flatlock_gross_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `flatlock_payable_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `flatlock_deduct_advance` DECIMAL(10, 2) DEFAULT 0.00,
  
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);


CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    operation VARCHAR(255) NOT NULL,
    overlock_operator TINYINT(1) DEFAULT 0,
    flatlock_operator TINYINT(1) DEFAULT 0,
    aadhar_number VARCHAR(12) UNIQUE,
    pan_number VARCHAR(10) UNIQUE,
    mobile_number VARCHAR(15) UNIQUE,
    aadhar_front VARCHAR(255) DEFAULT NULL,
    aadhar_back VARCHAR(255) DEFAULT NULL,
    pan_card_image VARCHAR(255) DEFAULT NULL,
    photo VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);