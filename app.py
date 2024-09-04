from flask import Flask, jsonify, request, send_from_directory, make_response, render_template ,session
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import OperationalError

app = Flask(__name__)

# Configure your PostgreSQL connection details
DB_HOST = 'dbc95a5.online-server.cloud'
DB_PORT = 5432
DB_USER = 'postgres'
DB_PASSWORD = 'PgresPW#amotIQ'
DB_NAME = 'planungstool'
DB_NAME1 = 'gemeinsam'


app.secret_key = 'supersecretkey' 
global currentServer

# SQLAlchemy connection string
DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
DATABASE_URL1 = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME1}'

# Create SQLAlchemy engine
engine= create_engine(DATABASE_URL)
engine1= create_engine(DATABASE_URL1)

selected_db = None 


servers = [
    {"host": "dbc95a5.online-server.cloud", "port": 5432, "user": "postgres", "password": "PgresPW#amotIQ"},
    {"host": "9a8fdf0.online-server.cloud", "port": 5432, "user": "postgres", "password": "PgresPW#amotIQ"}
 
]
def check_database_exists(host, port, user, password, database_name, timeout=50):
    try:
        # Connect to the PostgreSQL server with a timeout
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=timeout
        )
       
        cursor = conn.cursor()
       
        # Check if database exists
        query = """
        SELECT 1
        FROM pg_database
        WHERE datname = %s;
        """
       
        cursor.execute(query, (database_name,))
        exists = cursor.fetchone()
        cursor.close()
        conn.close()
       
        return exists is not None
 
    except OperationalError as e:
        print(f"OperationalError: {e}")
        return False




@app.route('/')
def index():
    return send_from_directory('.', 'index.html')
 
@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')
 
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)


@app.route('/export', methods=['POST'])

def export_route():
    global selected_db_global
    data = request.json
    selected_db_global = data.get('selectedDatabase')
    print(selected_db_global)
    session['selected_db'] = selected_db
    return jsonify({'message': 'Database selected', 'selectedDatabase': selected_db_global})

# Configure scoped session
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))

# Function to get a connection to the PostgreSQL database
def get_db_connection(InputDB,InputHost):
    conn = psycopg2.connect(
        host=InputHost,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=InputDB
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
    global selected_db_global  # Make sure to use the global variable
    selected_db = selected_db_global.lower() 
    print("now")
    print(selected_db)
    try:
        for server in servers:

          if check_database_exists(
            host=server["host"],
            port=server["port"],
            user=server["user"],
            password=server["password"],
            database_name=selected_db
        ):
                


                # Connect to the selected database on the correct server
                conn = psycopg2.connect(
                    host=server["host"],
                    port=server["port"],
                    user=server["user"],
                    password=server["password"],
                    dbname=selected_db
                )
                cursor = conn.cursor()
                global currentServer
                currentServer=server["host"]
        

        
       
               
        # Use the correct server for connection (assuming 'currentServer' is set correctly)
        
        cursor = conn.cursor()

        
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
        conn = get_db_connection("planungstool", "dbc95a5.online-server.cloud")
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

