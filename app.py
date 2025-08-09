import os
import logging
import datetime
import uuid
import json
import urllib.request
import PyPDF2
import urllib.parse
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Create Flask app and database
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET") or "dev-secret-key-change-in-production"
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # needed for url_for to generate with https

# Gemini API configuration
GEMINI_API_KEY = "AIzaSyCa-GNMY5ESWwLzAdaJKX9MEgoWU-UREkI"

# Maritime vocabulary and phrases database for fallback
MARITIME_VOCABULARY = {
    "basic_terms": {
        "español": ["puerto", "ancla", "cubierta", "motor", "navegación", "timón", "proa", "popa", "estribor", "babor"],
        "english": ["port", "anchor", "deck", "engine", "navigation", "rudder", "bow", "stern", "starboard", "port"],
        "chinese": ["港口", "锚", "甲板", "引擎", "导航", "舵", "船头", "船尾", "右舷", "左舷"],
        "greek": ["λιμάνι", "άγκυρα", "κατάστρωμα", "μηχανή", "πλοήγηση", "πηδάλιο", "πλώρη", "πρύμνη", "δεξιά", "αριστερά"]
    },
    "emergency_phrases": {
        "español": ["emergencia", "fuga de combustible", "incendio", "abandono de buque", "hombre al agua"],
        "english": ["emergency", "fuel leak", "fire", "abandon ship", "man overboard"],
        "chinese": ["紧急情况", "燃料泄漏", "火灾", "弃船", "有人落水"],
        "greek": ["επείγουσα ανάγκη", "διαρροή καυσίμου", "φωτιά", "εγκατάλειψη πλοίου", "άνθρωπος στη θάλασσα"]
    }
}

# Gemini API function for maritime phraseology
def call_gemini_api(user_message):
    """
    Call Gemini API for maritime phraseology translations and vocabulary with fallback
    """
    try:
        # System prompt specifically for maritime phraseology
        system_prompt = (
            "Eres un asistente especializado en fraseología marítima para la Escuela Náutica de Venezuela. "
            "Tu experiencia incluye:\n\n"
            "1. Traducir términos y frases marítimas a/desde cualquier idioma\n"
            "2. Proporcionar listas de vocabulario marítimo básico\n"
            "3. Explicar terminología náutica usada en operaciones de marina mercante\n"
            "4. Ayudar con estándares de comunicación marítima internacional\n\n"
            "Siempre responde en español a menos que específicamente se pida traducir a otro idioma. "
            "Enfócate en terminología marítima práctica usada en:\n"
            "- Operaciones de buques y navegación\n"
            "- Comunicaciones portuarias\n"
            "- Procedimientos de seguridad\n"
            "- Ingeniería marítima\n"
            "- Regulaciones marítimas internacionales\n\n"
            "Si te piden una lista de vocabulario básico, proporciona 20-30 términos marítimos esenciales con traducciones."
        )
        
        # Prepare the request data
        data = {
            "contents": [{
                "parts": [{
                    "text": f"Contexto del sistema: {system_prompt}\n\nPregunta del usuario: {user_message}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.8,
                "topK": 40,
                "maxOutputTokens": 1000
            }
        }
        
        # Make the HTTP request
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        # Extract the response text
        if 'candidates' in result and len(result['candidates']) > 0:
            if 'content' in result['candidates'][0] and 'parts' in result['candidates'][0]['content']:
                return result['candidates'][0]['content']['parts'][0]['text']
        
        return get_fallback_response(user_message)
        
    except Exception as e:
        logging.error(f"Error calling Gemini API: {e}")
        return get_fallback_response(user_message)

def get_fallback_response(user_message):
    """
    Provide fallback responses for common maritime phraseology queries
    """
    message_lower = user_message.lower()
    
    if "vocabulario" in message_lower or "lista" in message_lower or "básico" in message_lower:
        return """**Vocabulario Marítimo Básico**

| Español | Inglés | Chino | Griego |
|---------|--------|-------|--------|
| Puerto | Port | 港口 | Λιμάνι |
| Ancla | Anchor | 锚 | Άγκυρα |
| Cubierta | Deck | 甲板 | Κατάστρωμα |
| Motor | Engine | 引擎 | Μηχανή |
| Navegación | Navigation | 导航 | Πλοήγηση |
| Timón | Rudder | 舵 | Πηδάλιο |
| Proa | Bow | 船头 | Πλώρη |
| Popa | Stern | 船尾 | Πρύμνη |
| Estribor | Starboard | 右舷 | Δεξιά |
| Babor | Port | 左舷 | Αριστερά |

Nota: Actualmente en modo offline. Para traducciones más específicas, contacta al departamento de idiomas."""

    elif "emergencia" in message_lower:
        return """**Frases de Emergencia Marítimas**

| Español | Inglés | Contexto |
|---------|--------|----------|
| Emergencia | Emergency | Situación crítica |
| Fuga de combustible | Fuel leak | Problema técnico |
| Incendio | Fire | Emergencia de seguridad |
| Abandono de buque | Abandon ship | Evacuación |
| Hombre al agua | Man overboard | Rescate |

Nota: Estoy en modo offline. Para obtener respuestas más detalladas con IA, por favor intenta más tarde."""

    elif "traduce" in message_lower or "traducir" in message_lower:
        return """Para traducciones específicas, puedo ayudarte con estos términos básicos:

**Términos de Navegación:**
- Rumbo → Course (inglés), 航向 (chino)
- Velocidad → Speed (inglés), 速度 (chino)
- Latitud → Latitude (inglés), 纬度 (chino)
- Longitud → Longitude (inglés), 经度 (chino)

**Comunicación:**
- Radio → Radio (inglés), 无线电 (chino)
- Mensaje → Message (inglés), 消息 (chino)
- Capitán → Captain (inglés), 船长 (chino)

Nota: Actualmente en modo básico. La IA avanzada volverá pronto."""

    else:
        return """¡Hola! Soy tu asistente de fraseología marítima. Actualmente estoy en modo básico, pero puedo ayudarte con:

• **Vocabulario básico** - Di "vocabulario básico"
• **Frases de emergencia** - Di "frases de emergencia"  
• **Traducciones simples** - Di "traduce [término]"

**Ejemplos:**
- "Dame vocabulario básico"
- "Frases de emergencia"
- "Traduce sala de máquinas"

La IA completa volverá pronto para consultas más avanzadas."""

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL") or "sqlite:///nautical_training.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# File upload configuration
app.config['UPLOAD_FOLDER'] = 'static/repositorio/documents/'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Initialize database

db = SQLAlchemy(app, model_class=Base)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Debes iniciar sesión para acceder a esta página.'
login_manager.login_message_category = 'info'

# Define models here to avoid circular imports
class Estudiante(UserMixin, db.Model):
    __tablename__ = 'estudiantes'
    
    id = db.Column(db.Integer, primary_key=True)
    cedula = db.Column(db.String(15), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    fecha_nacimiento = db.Column(db.Date)
    direccion = db.Column(db.Text)
    semestre = db.Column(db.Integer, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    def get_nombre_completo(self):
        return f'{self.nombre} {self.apellido}'

class Profesor(UserMixin, db.Model):
    __tablename__ = 'profesores'
    
    id = db.Column(db.Integer, primary_key=True)
    cedula = db.Column(db.String(15), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    departamento = db.Column(db.String(100), nullable=False)
    materias = db.Column(db.Text)
    experiencia_anos = db.Column(db.Integer)
    titulo_academico = db.Column(db.String(200))
    password_hash = db.Column(db.String(256), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    def get_nombre_completo(self):
        return f'{self.nombre} {self.apellido}'
    
    def get_materias_lista(self):
        if self.materias:
            return [materia.strip() for materia in self.materias.split(',')]
        return []

class EvaluacionDocente(db.Model):
    __tablename__ = 'evaluaciones_docentes'
    
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    profesor_id = db.Column(db.Integer, db.ForeignKey('profesores.id'), nullable=False)
    dominio_materia = db.Column(db.Integer, nullable=False)
    claridad_explicacion = db.Column(db.Integer, nullable=False)
    puntualidad = db.Column(db.Integer, nullable=False)
    disponibilidad = db.Column(db.Integer, nullable=False)
    metodologia = db.Column(db.Integer, nullable=False)
    evaluacion_general = db.Column(db.Integer, nullable=False)
    aspectos_positivos = db.Column(db.Text)
    aspectos_mejorar = db.Column(db.Text)
    comentarios_generales = db.Column(db.Text)
    recomendacion = db.Column(db.String(20), nullable=False)
    semestre = db.Column(db.Integer, nullable=False)
    periodo_academico = db.Column(db.String(10), nullable=False)
    fecha_evaluacion = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    estudiante = db.relationship('Estudiante', backref='evaluaciones')
    profesor = db.relationship('Profesor', backref='evaluaciones_recibidas')

class VideoClase(db.Model):
    __tablename__ = 'videos_clases'
    
    id = db.Column(db.Integer, primary_key=True)
    profesor_id = db.Column(db.Integer, db.ForeignKey('profesores.id'), nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    materia = db.Column(db.String(100), nullable=False)
    semestre = db.Column(db.Integer)
    archivo_video = db.Column(db.String(500))
    url_video = db.Column(db.String(500))
    duracion_minutos = db.Column(db.Integer)
    fecha_subida = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    profesor = db.relationship('Profesor', backref='videos_subidos')

class TokenQRProfesor(db.Model):
    __tablename__ = 'tokens_qr_profesores'
    
    id = db.Column(db.Integer, primary_key=True)
    profesor_id = db.Column(db.Integer, db.ForeignKey('profesores.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    fecha_expiracion = db.Column(db.DateTime)
    activo = db.Column(db.Boolean, default=True)
    usos = db.Column(db.Integer, default=0)
    
    profesor = db.relationship('Profesor', backref='tokens_qr')

class DocumentoRepositorio(db.Model):
    __tablename__ = 'documentos_repositorio'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    autor_id = db.Column(db.Integer, db.ForeignKey('profesores.id'), nullable=False)
    tipo_documento = db.Column(db.String(50), nullable=False)  # 'tesis', 'libro', 'articulo', 'manual'
    categoria = db.Column(db.String(100), nullable=False)  # 'Ingeniería Marítima', 'Navegación', etc.
    archivo_pdf = db.Column(db.String(500))
    url_externa = db.Column(db.String(500))
    isbn = db.Column(db.String(20))
    fecha_publicacion = db.Column(db.Date)
    fecha_subida = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    descargas = db.Column(db.Integer, default=0)
    activo = db.Column(db.Boolean, default=True)
    palabras_clave = db.Column(db.Text)  # separadas por comas
    
    autor = db.relationship('Profesor', backref='documentos_repositorio')

# User loader for login manager
@login_manager.user_loader
def load_user(user_id):
    user = Estudiante.query.get(user_id)
    if user:
        user.user_type = 'estudiante'
        return user
    
    user = Profesor.query.get(user_id)
    if user:
        user.user_type = 'profesor'
        return user
    
    return None

# Create upload directory if it doesn't exist
upload_dir = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(upload_dir, exist_ok=True)

# Create database tables
with app.app_context():
    db.create_all()

# Context processor to add date information to all templates
@app.context_processor
def inject_now():
    return {'now': datetime.datetime.now()}

# Routes

@app.route('/')
def index():
    return render_template('inicio/index.html')

@app.route('/registro')
def registro():
    return render_template('admision/registro.html')

@app.route('/admision')
def admision():
    return render_template('admision/admision.html')

@app.route('/historia')
def historia():
    return render_template('vida academica/historia.html')

@app.route('/pasantias')
def pasantias():
    return render_template('vida academica/pasantias.html')

@app.route('/idiomas')
def idiomas():
    return render_template('vida academica/idiomas.html')

@app.route('/uniforme')
def uniforme():
    return render_template('recursos/uniforme.html')

@app.route('/vida-cadete')
def vida_cadete():
    return render_template('vida academica/vida_cadete.html')

@app.route('/games')
def games():
    return render_template('recursos/games.html')

@app.route('/noticias')
def noticias():
    return render_template('noticias y eventos/noticias.html')

@app.route('/jornada')
def jornada():
    return render_template('noticias y eventos/jornada.html')

@app.route('/autoridades')
def autoridades_env():
    return render_template('autoridades/autoridadesENV.html')

@app.route('/sugerencias', methods=['GET', 'POST'])
def sugerencias():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        mensaje = request.form.get('mensaje')
        
        # Esta parte del codigo des para la base de datos
        # De momento solo aparecera este comentario
        flash('¡Gracias por tu sugerencia! La revisaremos pronto.', 'success')
        return redirect(url_for('sugerencias'))
        
    return render_template('sugerencias/sugerencias.html')

@app.route('/biblioteca')
def biblioteca():
    return render_template('recursos/biblioteca.html')

def extraer_metadatos_pdf(nombre_archivo):
    ruta_pdf = os.path.join(app.root_path, 'static', 'repositorio', 'documents', nombre_archivo)
    if not os.path.exists(ruta_pdf):
        return None
    try:
        with open(ruta_pdf, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            info = reader.metadata
            num_paginas = len(reader.pages)
            return {
                'titulo': info.title,
                'autor': info.author,
                'num_paginas': num_paginas,
                'productor': info.producer,
                'asunto': info.subject,
                'creado': info.creation_date
            }
    except Exception as e:
        print(f"Error extrayendo metadatos: {e}")
        return None

def verificar_pdfs_registrados():
    pdf_dir = os.path.join(app.root_path, 'static', 'repositorio', 'documents')
    archivos_pdf = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    registrados = []
    no_registrados = []

    for nombre_archivo in archivos_pdf:
        existe = DocumentoRepositorio.query.filter_by(archivo_pdf=nombre_archivo).first()
        if existe:
            registrados.append(nombre_archivo)
        else:
            no_registrados.append(nombre_archivo)

    print("PDFs registrados en la base de datos:")
    for r in registrados:
        print(f" - {r}")
    print("\nPDFs NO registrados en la base de datos:")
    for nr in no_registrados:
        print(f" - {nr}")

def generar_cedula_unica():
    numero = 1
    while True:
        cedula = f"V-{str(numero).zfill(8)}"
        existe = Profesor.query.filter_by(cedula=cedula).first()
        if not existe:
            return cedula
        numero += 1

def registrar_pdfs_preexistentes():
    pdf_dir = os.path.join(app.root_path, 'static', 'repositorio', 'documents')
    archivos_pdf = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    nuevos_registros = 0

    for nombre_archivo in archivos_pdf:
        existe = DocumentoRepositorio.query.filter_by(archivo_pdf=nombre_archivo).first()
        if not existe:
            metadatos = extraer_metadatos_pdf(nombre_archivo)
            
            # Extraer autores (pueden estar separados por coma o punto y coma)
            autores = []
            if metadatos and metadatos.get('autor'):
                autores_raw = metadatos['autor']
                if ';' in autores_raw:
                    autores = [a.strip() for a in autores_raw.split(';')]
                elif ',' in autores_raw:
                    autores = [a.strip() for a in autores_raw.split(',')]
                else:
                    autores = [autores_raw.strip()]
            else:
                autores = ['Autor Desconocido']

            # Registrar cada autor si no existe y usar el primero como autor principal
            autor_ids = []
            for autor_nombre in autores:
                autor = Profesor.query.filter(
                    db.or_(
                        Profesor.nombre.ilike(f"%{autor_nombre}%"),
                        Profesor.apellido.ilike(f"%{autor_nombre}%")
                    )
                ).first()
                if not autor:
                    cedula_generada = generar_cedula_unica()
                    autor = Profesor(
                        cedula=cedula_generada,
                        nombre=autor_nombre,
                        apellido='',
                        email=f"autor_{uuid.uuid4().hex}@umc.edu.ve",
                        departamento='Desconocido',
                        materias='',
                        password_hash=generate_password_hash('temporal'),
                        activo=True
                    )
                    db.session.add(autor)
                    db.session.flush()
                autor_ids.append(autor.id)
            autor_id = autor_ids[0] if autor_ids else 1  # Usa el primero como principal

            # Tipo de documento automático
            tipo_documento = 'articulo'
            titulo_lower = (metadatos['titulo'].lower() if metadatos and metadatos.get('titulo') else '') 
            nombre_lower = nombre_archivo.lower()
            if 'tesis' in titulo_lower or nombre_lower.startswith('tesis'):
                tipo_documento = 'tesis'
            elif 'libro' in titulo_lower or nombre_lower.startswith('libro'):
                tipo_documento = 'libro'
            elif 'manual' in titulo_lower or nombre_lower.startswith('manual'):
                tipo_documento = 'manual'

            # Categoría automática
            categoria = 'General'
            asunto = metadatos.get('asunto') if metadatos else ''
            if asunto:
                categoria = asunto
            elif 'ingenieria' in nombre_lower:
                categoria = 'Ingeniería Marítima'
            elif 'navegacion' in nombre_lower:
                categoria = 'Navegación'
            elif 'seguridad' in nombre_lower:
                categoria = 'Seguridad Marítima'

            # ISBN y palabras clave
            isbn = metadatos.get('isbn') if metadatos and metadatos.get('isbn') else None
            palabras_clave = None
            if metadatos:
                if metadatos.get('palabras_clave'):
                    palabras_clave = metadatos['palabras_clave']
                elif hasattr(metadatos, 'keywords') and metadatos.keywords:
                    palabras_clave = metadatos.keywords

            # Fecha de publicación
            fecha_publicacion = None
            if metadatos and metadatos.get('creado'):
                try:
                    # PyPDF2 suele devolver la fecha en formato 'D:YYYYMMDDHHmmSS'
                    fecha_raw = str(metadatos['creado'])
                    if fecha_raw.startswith('D:'):
                        fecha_raw = fecha_raw[2:]
                    fecha_publicacion = datetime.datetime.strptime(fecha_raw[:8], '%Y%m%d').date()
                except Exception:
                    fecha_publicacion = None

            nuevo_doc = DocumentoRepositorio(
                titulo=metadatos['titulo'] if metadatos and metadatos.get('titulo') else nombre_archivo,
                descripcion='Documento importado automáticamente.',
                autor_id=autor_id,
                tipo_documento=tipo_documento,
                categoria=categoria,
                archivo_pdf=nombre_archivo,
                activo=True,
                fecha_subida=datetime.datetime.utcnow(),
                isbn=isbn,
                palabras_clave=palabras_clave,
                fecha_publicacion=fecha_publicacion
            )
            db.session.add(nuevo_doc)
            nuevos_registros += 1

    db.session.commit()
    print(f"Se registraron {nuevos_registros} nuevos documentos PDF.")

@app.route('/zarpe')
@app.route('/repositorio')
def repositorio():
    # Get filter parameters
    categoria = request.args.get('categoria', '')
    tipo = request.args.get('tipo', '')
    buscar = request.args.get('buscar', '')
    
    # Query documents
    query = DocumentoRepositorio.query.filter_by(activo=True)
    
    if categoria:
        query = query.filter(DocumentoRepositorio.categoria == categoria)
    if tipo:
        query = query.filter(DocumentoRepositorio.tipo_documento == tipo)
    if buscar:
        query = query.filter(
            db.or_(
                DocumentoRepositorio.titulo.contains(buscar),
                DocumentoRepositorio.descripcion.contains(buscar),
                DocumentoRepositorio.palabras_clave.contains(buscar)
            )
        )
    
    documentos = query.order_by(DocumentoRepositorio.fecha_subida.desc()).all()
    documentos_con_metadatos = []
    for doc in documentos:
        metadatos = None
        autores = []
        if doc.archivo_pdf:
            metadatos = extraer_metadatos_pdf(doc.archivo_pdf)
            # Extraer autores del PDF
            if metadatos and metadatos.get('autor'):
                autores_raw = metadatos['autor']
                if ';' in autores_raw:
                    autores = [a.strip() for a in autores_raw.split(';')]
                elif ',' in autores_raw:
                    autores = [a.strip() for a in autores_raw.split(',')]
                else:
                    autores = [autores_raw.strip()]
            else:
                # Si no hay autores en metadatos, usa el autor de la base de datos
                autores = [doc.autor.get_nombre_completo()]
        else:
            autores = [doc.autor.get_nombre_completo()]
        documentos_con_metadatos.append({
            'documento': doc,
            'metadatos': metadatos,
            'autores': autores
        })
    # Get categories and types for filters
    categorias = db.session.query(DocumentoRepositorio.categoria).filter_by(activo=True).distinct().all()
    tipos = db.session.query(DocumentoRepositorio.tipo_documento).filter_by(activo=True).distinct().all()
    
    return render_template('repositorio/zarpe.html', 
                         documentos=documentos_con_metadatos,
                         categorias=[c[0] for c in categorias],
                         tipos=[t[0] for t in tipos],
                         categoria_actual=categoria,
                         tipo_actual=tipo,
                         buscar_actual=buscar)

@app.route('/repositorio/subir', methods=['GET', 'POST'])
@login_required
def subir_documento():
    # Only professors can upload documents
    if not hasattr(current_user, '__class__') or current_user.__class__.__name__ != 'Profesor':
        flash('Solo los profesores pueden subir documentos al repositorio.', 'error')
        return redirect(url_for('repositorio'))
    
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        descripcion = request.form.get('descripcion')
        tipo_documento = request.form.get('tipo_documento')
        categoria = request.form.get('categoria')
        palabras_clave = request.form.get('palabras_clave')
        isbn = request.form.get('isbn')
        fecha_publicacion = request.form.get('fecha_publicacion')
        url_externa = request.form.get('url_externa')
        
        # Validate required fields
        if not all([titulo, tipo_documento, categoria]):
            flash('Título, tipo de documento y categoría son obligatorios.', 'error')
            return redirect(url_for('subir_documento'))
        
        # Handle file upload
        archivo_pdf = None
        if 'archivo_pdf' in request.files:
            file = request.files['archivo_pdf']
            if file.filename != '':
                filename = secure_filename(file.filename)
                # Generate unique filename
                unique_filename = f"{uuid.uuid4()}_{filename}"
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                archivo_pdf = unique_filename
        
        # Create new document
        nuevo_documento = DocumentoRepositorio()
        nuevo_documento.titulo = titulo
        nuevo_documento.descripcion = descripcion
        nuevo_documento.autor_id = current_user.id
        nuevo_documento.tipo_documento = tipo_documento
        nuevo_documento.categoria = categoria
        nuevo_documento.palabras_clave = palabras_clave
        nuevo_documento.isbn = isbn
        nuevo_documento.archivo_pdf = archivo_pdf
        nuevo_documento.url_externa = url_externa
        
        if fecha_publicacion:
            try:
                nuevo_documento.fecha_publicacion = datetime.datetime.strptime(fecha_publicacion, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        db.session.add(nuevo_documento)
        db.session.commit()
        
        flash('Documento subido exitosamente al repositorio.', 'success')
        return redirect(url_for('repositorio'))
    
    return render_template('repositorio/subir_documento.html')

@app.route('/repositorio/descargar/<int:documento_id>')
def descargar_documento(documento_id):
    documento = DocumentoRepositorio.query.get_or_404(documento_id)
    
    if not documento.activo:
        flash('El documento no está disponible.', 'error')
        return redirect(url_for('repositorio'))
    
    # Increment download counter
    documento.descargas += 1
    db.session.commit()
    
    if documento.archivo_pdf:
        # Ruta absoluta del archivo en el servidor
        file_path = os.path.join(app.root_path, 'static', 'repositorio', 'documents', documento.archivo_pdf)
        if os.path.exists(file_path):
            # Si existe, redirige al archivo en static
            return redirect(url_for('static', filename=f'repositorio/documents/{documento.archivo_pdf}'))
        else:
            flash('El archivo PDF no existe en el repositorio.', 'error')
            return redirect(url_for('repositorio'))
    elif documento.url_externa:
        # Redirect to external URL
        return redirect(documento.url_externa)
    else:
        flash('El documento no tiene archivo disponible.', 'error')
        return redirect(url_for('repositorio'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user_type = request.form.get('user_type')
        
        if user_type == 'estudiante':
            query = "SELECT * FROM estudiantes WHERE email = %s AND activo = TRUE"
        elif user_type == 'profesor':
            query = "SELECT * FROM profesores WHERE email = %s AND activo = TRUE"
        else:
            flash('Tipo de usuario inválido.', 'error')
            return redirect(url_for('login'))
        
        # Execute query using SQL tool would be complex, let's use Flask-SQLAlchemy models
        if user_type == 'estudiante':
            user = Estudiante.query.filter_by(email=email, activo=True).first()
        else:
            user = Profesor.query.filter_by(email=email, activo=True).first()
        
        if user and user.password_hash and check_password_hash(user.password_hash, password):
            login_user(user)
            user.user_type = user_type
            
            next_page = request.args.get('next')
            if user_type == 'profesor':
                return redirect(next_page) if next_page else redirect(url_for('panel_profesor'))
            else:
                return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Email o contraseña incorrectos.', 'error')
    
    return render_template('iniciar sesion/login.html')

@app.route('/logout')
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente.', 'success')
    return redirect(url_for('index'))

@app.route('/registro-estudiante', methods=['GET', 'POST'])
def registro_estudiante():
    if request.method == 'POST':
        cedula = request.form.get('cedula')
        nombre = request.form.get('nombre')
        apellido = request.form.get('apellido')
        email = request.form.get('email')
        telefono = request.form.get('telefono')
        semestre = request.form.get('semestre')
        password = request.form.get('password')
        
        # Validate required fields
        if not all([cedula, nombre, apellido, email, semestre, password]):
            flash('Todos los campos obligatorios deben ser completados.', 'error')
            return redirect(url_for('registro_estudiante'))
        
        # Check if user already exists
        existing_student = Estudiante.query.filter(
            (Estudiante.email == email) | (Estudiante.cedula == cedula)
        ).first()
        
        if existing_student:
            flash('Ya existe un estudiante con esa cédula o email.', 'error')
            return redirect(url_for('registro_estudiante'))
        
        # Create new student
        new_student = Estudiante()
        new_student.cedula = cedula
        new_student.nombre = nombre
        new_student.apellido = apellido
        new_student.email = email
        new_student.telefono = telefono
        new_student.semestre = int(semestre) if semestre else 1
        new_student.password_hash = generate_password_hash(password) if password else ''
        
        db.session.add(new_student)
        db.session.commit()
        
        flash('Registro exitoso. Ya puedes iniciar sesión.', 'success')
        return redirect(url_for('login'))
    
    return render_template('iniciar sesion/registro_estudiante.html')

@app.route('/registro-profesor', methods=['GET', 'POST'])
def registro_profesor():
    if request.method == 'POST':
        cedula = request.form.get('cedula')
        nombre = request.form.get('nombre')
        apellido = request.form.get('apellido')
        email = request.form.get('email')
        telefono = request.form.get('telefono')
        departamento = request.form.get('departamento')
        materias = request.form.get('materias')
        experiencia_anos = request.form.get('experiencia_anos')
        titulo_academico = request.form.get('titulo_academico')
        password = request.form.get('password')
        
        # Validate required fields
        if not all([cedula, nombre, apellido, email, departamento, materias, password]):
            flash('Todos los campos obligatorios deben ser completados.', 'error')
            return redirect(url_for('registro_profesor'))
        
        # Check if professor already exists
        existing_professor = Profesor.query.filter(
            (Profesor.email == email) | (Profesor.cedula == cedula)
        ).first()
        
        if existing_professor:
            flash('Ya existe un profesor con esa cédula o email.', 'error')
            return redirect(url_for('registro_profesor'))
        
        # Create new professor
        new_professor = Profesor()
        new_professor.cedula = cedula
        new_professor.nombre = nombre
        new_professor.apellido = apellido
        new_professor.email = email
        new_professor.telefono = telefono
        new_professor.departamento = departamento
        new_professor.materias = materias
        new_professor.experiencia_anos = int(experiencia_anos) if experiencia_anos else None
        new_professor.titulo_academico = titulo_academico
        new_professor.password_hash = generate_password_hash(password) if password else ''
        
        db.session.add(new_professor)
        db.session.commit()
        
        flash('Registro exitoso. Ya puedes iniciar sesión.', 'success')
        return redirect(url_for('login'))
    
    return render_template('iniciar sesion/registro_profesor.html')

@app.route('/panel-profesor')
@login_required
def panel_profesor():
    if not hasattr(current_user, 'user_type') or current_user.user_type != 'profesor':
        flash('Acceso denegado. Solo para profesores.', 'error')
        return redirect(url_for('index'))
    
    # Get professor's QR token
    qr_token = TokenQRProfesor.query.filter_by(
        profesor_id=current_user.id, 
        activo=True
    ).first()
    
    if not qr_token:
        # Generate new QR token
        token = str(uuid.uuid4())
        qr_token = TokenQRProfesor(
            profesor_id=current_user.id,
            token=token
        )
        db.session.add(qr_token)
        db.session.commit()
    
    # Get professor's videos
    videos = VideoClase.query.filter_by(
        profesor_id=current_user.id,
        activo=True
    ).order_by(VideoClase.fecha_subida.desc()).all()
    
    # Get evaluations received
    evaluaciones = EvaluacionDocente.query.filter_by(
        profesor_id=current_user.id
    ).order_by(EvaluacionDocente.fecha_evaluacion.desc()).limit(10).all()
    
    evaluation_url = url_for('evaluar_docente_token', token=qr_token.token, _external=True)
    
    return render_template('iniciar sesion/panel_profesor.html', 
                         qr_token=qr_token.token,
                         evaluation_url=evaluation_url,
                         videos=videos,
                         evaluaciones=evaluaciones)

@app.route('/subir-video', methods=['GET', 'POST'])
@login_required
def subir_video():
    if not hasattr(current_user, 'user_type') or current_user.user_type != 'profesor':
        flash('Acceso denegado. Solo para profesores.', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        descripcion = request.form.get('descripcion')
        materia = request.form.get('materia')
        semestre = request.form.get('semestre')
        url_video = request.form.get('url_video')
        duracion_minutos = request.form.get('duracion_minutos')
        
        # Handle file upload
        archivo_video = None
        if 'archivo_video' in request.files:
            file = request.files['archivo_video']
            if file and file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                archivo_video = f'uploads/{filename}'
        
        new_video = VideoClase(
            profesor_id=current_user.id,
            titulo=titulo,
            descripcion=descripcion,
            materia=materia,
            semestre=int(semestre) if semestre else None,
            archivo_video=archivo_video,
            url_video=url_video,
            duracion_minutos=int(duracion_minutos) if duracion_minutos else None
        )
        
        db.session.add(new_video)
        db.session.commit()
        
        flash('Video subido exitosamente.', 'success')
        return redirect(url_for('panel_profesor'))
    
    return render_template('subir_video.html')

@app.route('/evaluar/<token>')
def evaluar_docente_token(token):
    # Find professor by token
    qr_token = TokenQRProfesor.query.filter_by(token=token, activo=True).first()
    if not qr_token:
        flash('Token de evaluación inválido o expirado.', 'error')
        return redirect(url_for('index'))
    
    profesor = qr_token.profesor
    
    # Increment usage counter
    qr_token.usos += 1
    db.session.commit()
    
    return render_template('evaluar_docente_privado.html', profesor=profesor, token=token)

@app.route('/evaluar-docente-submit', methods=['POST'])
def evaluar_docente_submit():
    token = request.form.get('token')
    
    # Find professor by token
    qr_token = TokenQRProfesor.query.filter_by(token=token, activo=True).first()
    if not qr_token:
        flash('Token de evaluación inválido.', 'error')
        return redirect(url_for('index'))
    
    # Get evaluation data
    estudiante_cedula = request.form.get('estudiante_cedula')
    estudiante_nombre = request.form.get('estudiante_nombre')
    semestre = request.form.get('semestre')
    periodo_academico = request.form.get('periodo')
    
    # Ratings
    dominio_materia = int(request.form.get('dominio_materia'))
    claridad_explicacion = int(request.form.get('claridad_explicacion'))
    puntualidad = int(request.form.get('puntualidad'))
    disponibilidad = int(request.form.get('disponibilidad'))
    metodologia = int(request.form.get('metodologia'))
    evaluacion_general = int(request.form.get('evaluacion_general'))
    
    # Comments
    aspectos_positivos = request.form.get('aspectos_positivos')
    aspectos_mejorar = request.form.get('aspectos_mejorar')
    comentarios_generales = request.form.get('comentarios_generales')
    recomendacion = request.form.get('recomendacion')
    
    # Find or create student (anonymous evaluation, we only store basic info)
    estudiante = Estudiante.query.filter_by(cedula=estudiante_cedula).first()
    if not estudiante:
        # Create temporary student record for evaluation purposes
        estudiante = Estudiante(
            cedula=estudiante_cedula,
            nombre=estudiante_nombre.split()[0],
            apellido=' '.join(estudiante_nombre.split()[1:]) if len(estudiante_nombre.split()) > 1 else '',
            email=f"temp_{estudiante_cedula}@temp.umc.edu.ve",
            semestre=int(semestre),
            password_hash=generate_password_hash('temp_password')
        )
        db.session.add(estudiante)
        db.session.flush()  # Get the ID without committing
    
    # Check if evaluation already exists
    existing_eval = EvaluacionDocente.query.filter_by(
        estudiante_id=estudiante.id,
        profesor_id=qr_token.profesor_id,
        periodo_academico=periodo_academico
    ).first()
    
    if existing_eval:
        flash('Ya has evaluado a este profesor en este período académico.', 'warning')
        return redirect(url_for('index'))
    
    # Create evaluation
    new_evaluation = EvaluacionDocente(
        estudiante_id=estudiante.id,
        profesor_id=qr_token.profesor_id,
        dominio_materia=dominio_materia,
        claridad_explicacion=claridad_explicacion,
        puntualidad=puntualidad,
        disponibilidad=disponibilidad,
        metodologia=metodologia,
        evaluacion_general=evaluacion_general,
        aspectos_positivos=aspectos_positivos,
        aspectos_mejorar=aspectos_mejorar,
        comentarios_generales=comentarios_generales,
        recomendacion=recomendacion,
        semestre=int(semestre),
        periodo_academico=periodo_academico
    )
    
    db.session.add(new_evaluation)
    db.session.commit()
    
    flash(f'¡Evaluación enviada exitosamente para {qr_token.profesor.get_nombre_completo()}! Gracias por tu retroalimentación.', 'success')
    return redirect(url_for('index'))

@app.route('/classroom')
def classroom():
    # Get all videos from active professors
    videos = VideoClase.query.filter_by(activo=True).order_by(VideoClase.fecha_subida.desc()).all()
    
    # Group videos by subject
    videos_por_materia = {}
    for video in videos:
        if video.materia not in videos_por_materia:
            videos_por_materia[video.materia] = []
        videos_por_materia[video.materia].append(video)
    
    return render_template('recursos/classroom.html', videos_por_materia=videos_por_materia)

# Remove old docentes route since it's now private
@app.route('/docentes')
def docentes():
    flash('La evaluación docente ahora es privada. Los profesores proporcionan códigos QR individuales.', 'info')
    return redirect(url_for('index'))

# Maritime phraseology chatbot API endpoint
@app.route('/api/maritime-chat', methods=['POST'])
def maritime_chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        user_message = data.get('message', '')
        
        if not user_message or not str(user_message).strip():
            return jsonify({'error': 'Mensaje vacío'}), 400
        
        # Call Gemini API for maritime phraseology
        response = call_gemini_api(str(user_message).strip())
        
        return jsonify({'response': response})
        
    except Exception as e:
        logging.error(f"Error in maritime chat endpoint: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('layout.html', error="404 - Página no encontrada"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('layout.html', error="500 - Error del servidor"), 500

# Create database tables
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")
