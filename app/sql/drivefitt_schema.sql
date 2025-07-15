CREATE DATABASE drivefitt;

USE drivefitt;

-- Users Table (for Brand Website authentication)
CREATE TABLE users (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    status TINYINT DEFAULT 1 COMMENT '1=Active, 2=Inactive, 3=Suspended',
    email_verified TINYINT DEFAULT 0,
    phone_verified TINYINT DEFAULT 0,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Details Table (additional user information)
CREATE TABLE user_details (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    dob VARCHAR(50) NULL,
    gender ENUM('Male', 'Female', 'others') NULL,
    cms_user_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cms_created_at TIMESTAMP NULL,
    otp_verified BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) NULL,
    cms_sync_status ENUM('unsynced', 'synced', 'failed') DEFAULT 'unsynced',
    last_sync_attempt TIMESTAMP NULL,
    retry_count INT DEFAULT 0,
    metadata JSON NULL,
    FOREIGN KEY (cms_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_details_email (email),
    INDEX idx_user_details_phone (phone),
    INDEX idx_user_details_cms_sync (cms_sync_status)
);

-- Subscription Table (user subscription management)
CREATE TABLE subscription (
    subscription_id VARCHAR(50) NOT NULL PRIMARY KEY,
    cms_subscription_id VARCHAR(50) NULL,
    user_id VARCHAR(50) NOT NULL,
    cms_user_id INT NULL,
    plan_id VARCHAR(50) NOT NULL,
    base_amount INT NOT NULL,
    discount_amount INT DEFAULT 0,
    total_amount INT NOT NULL,
    coupon_code VARCHAR(50) NULL,
    discount_type ENUM('percentage', 'fixed', 'trial') NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_sub_id VARCHAR(100) NULL,
    rzp_invoice_id VARCHAR(100) NULL,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    last_payment_date TIMESTAMP NULL,
    status ENUM('active', 'paused', 'cancelled', 'expired') DEFAULT 'active',
    cms_sync_status ENUM('unsynced', 'synced', 'failed') DEFAULT 'unsynced',
    last_sync_attempt TIMESTAMP NULL,
    retry_count INT DEFAULT 0,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cms_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subscription_user (user_id),
    INDEX idx_subscription_cms_user (cms_user_id),
    INDEX idx_subscription_status (status),
    INDEX idx_subscription_payment_status (payment_status),
    INDEX idx_subscription_cms_sync (cms_sync_status)
);

-- Admin Users Table -- Reviewed
CREATE TABLE admins (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status TINYINT DEFAULT 1 COMMENT '1=Active, 2=Inactive',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Careers Table
CREATE TABLE careers (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    job_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship') DEFAULT 'Full-time',
    experience_level ENUM('Entry', 'Mid', 'Senior', 'Executive') DEFAULT 'Entry',
    salary_range VARCHAR(50) NULL,
    requirements TEXT NOT NULL,
    responsibilities TEXT NOT NULL,
    benefits TEXT NULL,
    status TINYINT DEFAULT 1 COMMENT '1=Active, 2=Inactive, 3=Draft',
    posted_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES admins(id)
);

-- Blogs Table
CREATE TABLE blogs (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(250) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    excerpt TEXT NULL,
    featured_image VARCHAR(500) NULL,
    author_id INT NOT NULL,
    category VARCHAR(100) NULL,
    tags JSON NULL,
    meta_title VARCHAR(250) NULL,
    meta_description TEXT NULL,
    status TINYINT DEFAULT 1 COMMENT '1=Published, 2=Draft, 3=Archived',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admins(id)
);

-- Contact Us Table -- Reviewed
CREATE TABLE contact_us (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Franchise Inquiries Table
CREATE TABLE franchise_inquiries (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    business_name VARCHAR(150)  NULL,
    contact_person VARCHAR(100)  NULL,
    email VARCHAR(100)  NULL,
    phone VARCHAR(20)  NULL,
    location VARCHAR(150)  NULL,
    city VARCHAR(100)  NULL,
    state VARCHAR(100)  NULL,
    investment_capacity DECIMAL(15,2) NULL,
    experience_years INT NULL,
    business_background TEXT NULL,
    why_franchise TEXT NULL,
    status TINYINT DEFAULT 1 COMMENT '1=New, 2=Contacted, 3=In Discussion, 4=Approved, 5=Rejected',
    notes TEXT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

-- User Login Data Table (for tracking user login activities) - Reviewed
CREATE TABLE user_logins (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    email VARCHAR(100) NULL,
    login_type ENUM('web', 'mobile', 'api') DEFAULT 'web',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_info JSON NULL,
    login_status ENUM('success', 'failed', 'blocked') DEFAULT 'success',
    failure_reason VARCHAR(100) NULL,
    logout_time TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE payments (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NULL,
    user_email VARCHAR(100) NULL,
    user_name VARCHAR(100) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'INR',
    payment_method ENUM('card', 'upi', 'netbanking', 'wallet', 'emi') NOT NULL,
    payment_gateway ENUM('razorpay', 'stripe', 'payu', 'cashfree') NOT NULL,
    gateway_transaction_id VARCHAR(100) NULL,
    status ENUM('pending', 'success', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    description TEXT NULL,
    metadata JSON NULL,
    gateway_response JSON NULL,
    refund_amount DECIMAL(10,2) NULL,
    refund_reason TEXT NULL,
    refunded_at TIMESTAMP NULL,
    subscription_id VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_careers_status ON careers(status);
CREATE INDEX idx_careers_location ON careers(location);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_author ON blogs(author_id);
CREATE INDEX idx_blogs_category ON blogs(category);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_franchise_status ON franchise_inquiries(status);
CREATE INDEX idx_franchise_location ON franchise_inquiries(city, state);
CREATE INDEX idx_user_logins_email ON user_logins(email);
CREATE INDEX idx_user_logins_user ON user_logins(user_id);
CREATE INDEX idx_user_logins_date ON user_logins(created_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_user ON payments(user_email);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(created_at);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

-- Insert default admin user (password: admin123)
INSERT INTO admins (email, phone, password, name) VALUES 
('admin@drivefitt.com', '+1234567890', '$2b$10$XOPbrlUPQdwdJUpSrIF6X.LHTjY8VHTyGdGvKxoVgvzrjHlPXm/Oi', 'Admin User'); 