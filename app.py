from flask import Flask, jsonify, request, send_from_directory, make_response, render_template
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Configure your PostgreSQL connection details
DB_HOST = '192.168.0.11'
DB_PORT = 5432
DB_USER = 'postgres'
DB_PASSWORD = 'PgresPW#amotIQ'
DB_NAME = 'planungstool'
DB_NAME1 = 'gemeinsam'




# SQLAlchemy connection string
DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
DATABASE_URL1 = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME1}'

# Create SQLAlchemy engine
engine= create_engine(DATABASE_URL)
engine1= create_engine(DATABASE_URL1)





@app.route('/')
def index():
    return send_from_directory('.', 'index.html')
 
@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')
 
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# Configure scoped session
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))

# Function to get a connection to the PostgreSQL database
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME
    )
    return conn

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/table/<table_name>', methods=['GET'])
def get_table_columns(table_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = %s;
        """
        cursor.execute(query, (table_name,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print('Error querying database:', e)
        return jsonify({'error': 'Error querying database'}), 500

@app.route('/uploadlogs/<table_name>', methods=['GET'])
def get_upload_logs(table_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT username, timestampval
            FROM tbl_uploadlog
            WHERE tabellename = %s
            ORDER BY timestampval DESC;
        """
        cursor.execute(query, (table_name,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print('Error querying database:', e)
        return jsonify({'error': 'Error querying database'}), 500



@app.route('/tool_info/<table_name>', methods=['GET'])
def tool_info(table_name):
    query = text("""
        SELECT tool_name, web_link, location, tool_info, tool_version, contact_person, "Support_email"
        FROM tbl_tools
        WHERE tool_name = :table_name
    """)
    with engine1.connect() as connection:
        result = connection.execute(query, {'table_name': table_name}).fetchone()
        if result:
            tool_info = {
                'tool_name': result[0],
                'web_link': result[1],
                'location': result[2],
                'tool_info': result[3],
                'tool_version': result[4],
                'contact_person': result[5],
                'Support_email': result[6]
            }
        else:
            tool_info = None
    return render_template('tools_info.html', tool_info=tool_info)


@app.route('/view_table/<table_name>', methods=['GET'])
def view_table(table_name):
    query = text(f"SELECT * FROM {table_name} LIMIT 100")  # Limit to 100 rows for display
    with engine.connect() as connection:
        result = connection.execute(query)
        columns = result.keys()
        rows = result.fetchall()
    return render_template('view_table.html', table_name=table_name, columns=columns, rows=rows)


if __name__ == '__main__':
    app.run(app)
