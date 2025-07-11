# NauticalTrainingHub - Escuela Náutica de Venezuela

## Overview

The NauticalTrainingHub is a comprehensive Flask-based web application for the Escuela Náutica de Venezuela (Venezuelan Nautical School). This platform serves as a digital hub for maritime education, providing functionality for student and professor management, course materials, evaluation systems, and administrative resources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database**: SQLite (local development) with SQLAlchemy ORM
- **Authentication**: Flask-Login for user session management
- **File Handling**: Built-in support for file uploads (videos, documents)
- **Configuration**: Environment-based configuration with fallback defaults

### Frontend Architecture
- **Template Engine**: Jinja2 (Flask's default templating)
- **CSS Framework**: Bootstrap 5 for responsive design
- **JavaScript**: Vanilla JavaScript with jQuery components
- **Icons**: Font Awesome for iconography
- **Fonts**: Google Fonts (Montserrat, Poppins)

### Application Structure
- **Entry Point**: `main.py` - Simple Flask application runner
- **Core Application**: `app.py` - Main application configuration and setup
- **Templates**: Organized by feature areas (admision, recursos, vida academica, etc.)
- **Static Assets**: CSS, JavaScript, and media files organized by type

## Key Components

### Authentication System
- User registration and login for students and professors
- Role-based access control (students vs professors)
- Session management with Flask-Login
- Password hashing using Werkzeug security utilities

### Educational Content Management
- **Classroom System**: Virtual learning platform
- **Video Upload**: Professors can upload educational content
- **Document Library**: Access to regulations, manuals, and academic resources
- **Digital Uniforms Guide**: Comprehensive uniform regulations and imagery

### Evaluation System
- **Professor Evaluation**: QR code-based anonymous evaluation system
- **Student Assessment**: Integration with classroom activities
- **Feedback Collection**: Suggestions and feedback mechanisms

### Information Portal
- **News and Events**: Academic announcements and updates
- **Admissions Process**: Complete enrollment workflow
- **Academic Life**: Student life, internships, language programs
- **Institution History**: Historical timeline and traditions

## Data Flow

1. **User Registration**: Students/professors register through dedicated forms
2. **Authentication**: Login system validates credentials and maintains sessions
3. **Content Access**: Role-based access to educational materials and features
4. **File Management**: Secure upload and storage of educational content
5. **Evaluation Process**: Anonymous feedback collection through QR codes
6. **Information Dissemination**: Static content delivery for institutional information

## External Dependencies

### Python Packages
- **Flask**: Core web framework
- **Flask-SQLAlchemy**: Database ORM
- **Flask-Login**: Authentication management
- **Werkzeug**: Security utilities and file handling

### Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive design
- **Font Awesome**: Icon library
- **Google Fonts**: Typography (Montserrat, Poppins)
- **jQuery**: JavaScript utilities (implied by Bootstrap components)

### Media and Assets
- **Images**: Institution logos, uniform guides, historical photos
- **Documents**: PDF regulations, manuals, and academic resources
- **Videos**: Educational content uploaded by professors

## Deployment Strategy

### Development Environment
- **Local Development**: SQLite database for easy setup
- **File Storage**: Local static directory for uploaded content
- **Debug Mode**: Enabled for development with detailed error reporting

### Production Considerations
- **Database**: Configurable via DATABASE_URL environment variable
- **File Uploads**: 100MB maximum file size limit
- **Security**: Environment-based secret key configuration
- **Session Management**: Secure session handling with configurable secrets

### Configuration Management
- **Environment Variables**: DATABASE_URL, SESSION_SECRET
- **Fallback Defaults**: SQLite for database, development key for sessions
- **Connection Pooling**: Configured for production database connections

## Notes

The application is designed with a clear separation between academic content (templates/static organization) and dynamic functionality (Flask routes and database models). The codebase suggests a traditional server-rendered application with progressive enhancement through JavaScript, following educational institution patterns for content management and user interaction.

The system appears to be in development phase, with some features like the professor evaluation system having sophisticated frontend JavaScript but basic backend integration. The application structure supports both Spanish and international maritime education standards.