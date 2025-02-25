from flask import Flask, jsonify, request, send_from_directory, make_response, render_template ,session
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import OperationalError
from datetime import datetime, timedelta
import json

app = Flask(__name__)

# Configure your PostgreSQL connection details
DB_HOST = '192.168.0.11'
DB_HOST2 = '192.168.0.12'
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
    {"host": "192.168.0.11", "port": 5432, "user": "postgres", "password": "PgresPW#amotIQ"},
    {"host": "192.168.0.12", "port": 5432, "user": "postgres", "password": "PgresPW#amotIQ"}
 
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


@app.route('/generate_tools_json', methods=['GET'])
def generate_tools_json():
    conn = get_db_connection("planungstool", "192.168.0.11")
    cursor = conn.cursor()

    try:
        # First SQL query for tools
        querySQL = "SELECT DISTINCT tool FROM tbl_tool_def WHERE tool IS NOT NULL"
        cursor.execute(querySQL)

        results = cursor.fetchall()

        nodes = []
        if not results:
            return jsonify({'success': False, 'message': 'No tools found in the database.'})

        for row in results:
            tool = row[0]
            print(tool)
            # Attempt to load as JSON, if it fails, treat it as plain text
            try:
                node = json.loads(tool)
            except json.JSONDecodeError:
                node = {
                    "ID": tool,
                    "name": tool,
                    "level": 2
                }
            nodes.append(node)

        # Create the structure for the first JSON file
        tools_data = {
            "nodes": nodes,
            "links": []
        }

        # Write the first JSON data to Tools.json
        
        # Second SQL query for query and tool
        querySQL = "SELECT DISTINCT query, tool FROM tbl_tool_def WHERE query IS NOT NULL"
        cursor.execute(querySQL)

        results = cursor.fetchall()
        
        nodes2 = []
        if not results:
            return jsonify({'success': False, 'message': 'No tools found in the database.'})

        for row in results:
            query = row[0]
            tool = row[1]

            print(tool)
            try:
                node = json.loads(tool)
            except json.JSONDecodeError:
                node = {
                    "ID": query,
                    "name": query,
                    "level": 3,
                    "Tool": tool
                }
            nodes2.append(node)

        # Create the structure for the second JSON file
        Planungstool_data = {
            "nodes": nodes2,
            "links": []
        }

       

        querySQL = "SELECT DISTINCT query, tables FROM tbl_tool_def WHERE query IS NOT NULL"
        cursor.execute(querySQL)

        results = cursor.fetchall()
        
        nodes3 = []
        if not results:
            return jsonify({'success': False, 'message': 'No tools found in the database.'})

        for row in results:
            query = row[0]
            names_string = row[1]

            # Split the names into a list
            names_list = names_string.split(';') if names_string else []

            
            try:
                node = json.loads(tool)
            except json.JSONDecodeError:
                node = {
                    "ID": query,
                    "names": names_list,
                    "level": 4
                }
            nodes3.append(node)

        # Create the structure for the second JSON file
        table_def_data = {
            "nodes": nodes3,
            "links": []
        }

        querySQL = "SELECT DISTINCT Funktion,Tool FROM tbl_tool_def WHERE query IS NOT NULL"
        cursor.execute(querySQL)

        results = cursor.fetchall()
        
        nodes4 = []
        if not results:
            return jsonify({'success': False, 'message': 'No tools found in the database.'})

        for row in results:
            Funktion = row[0]
            Tool = row[1]

            # Split the names into a list
            #names_list = names_string.split(';') if names_string else []

            
            try:
                node = json.loads(tool)
            except json.JSONDecodeError:
                node = {
                    "ID": Funktion,
                    "name": Funktion,
                    "FollowUpNode": Tool,
                    "level": 1
                }
            nodes4.append(node)

        # Create the structure for the second JSON file
        function_def_data = {
            "nodes": nodes4,
            "links": []
        }


        combined_data = {
        "tools_data": tools_data,
        "planningstool_data": Planungstool_data,
        "table_def_data":table_def_data,
        "function_def_data":function_def_data
    }

      
        

        return jsonify(combined_data)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

    finally:
        cursor.close()
        conn.close()


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
    
    try:
         
        conn = get_db_connection("planungstool", "192.168.0.11")
        cursor = conn.cursor()
  
               
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
    """ Fetches the latest upload log entry for a given table """
    conn = get_db_connection("gemeinsam", "192.168.0.11")
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT username, timestampval
        FROM tbl_uploadlog
        WHERE tabellename = %s
        ORDER BY timestampval DESC
        LIMIT 1;
    """
    
    cursor.execute(query, (table_name,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row and row["timestampval"]:
        timestamp = row["timestampval"]  # Already a datetime object

        return {
            "letzterAbzug": timestamp.strftime("%d.%m.%Y"),  # Convert directly
            "uhrzeit": timestamp.strftime("%H:%M:%S"),
            "timestamp": timestamp,
            "user": row["username"]
        }

    return {"letzterAbzug": "", "uhrzeit": "", "user": ""}  # Return empty if no log found





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



@app.route('/api/table-info', methods=['GET'])
def get_table_info():
    table_name = request.args.get('table')
    if not table_name:
        return jsonify({"error": "Table name is required"}), 400

    conn = get_db_connection("gemeinsam", "192.168.0.11")
    cursor = conn.cursor()

    # Query to fetch all rows from the table
    query = """
        SELECT tabelle, feldbeschreibung, beispiel, bemerkung
        FROM tbl_customizing
        WHERE tabelle = %s
    """
    
    cursor.execute(query, (table_name,))
    result = cursor.fetchall()
    
    cursor.close()
    conn.close()

    # Format response as a list of dictionaries
    table_info = [
        {
            "tabelle": row[0],
            "feldbeschreibung": row[1],
            "beispiel": row[2] if row[2] else "",  # Ensuring empty string instead of None
            "bemerkung": row[3] if row[3] else ""
        }
        for row in result
    ]

    return jsonify(table_info)


@app.route("/api/update-table-info", methods=["POST"])
def update_table_info():
    try:
        data = request.json
        updated_entries = data.get("updatedData", [])
        conn = get_db_connection("gemeinsam", "192.168.0.11")
        cursor = conn.cursor()

        for entry in updated_entries:
            query = """
                UPDATE tbl_customizing
                SET beispiel = %s, bemerkung = %s
                WHERE feldbeschreibung = %s
                AND tabelle = %s  -- Ensuring the update is for a specific table
            """
            cursor.execute(query, (entry["beispiel"], entry["bemerkung"], entry["feldbeschreibung"], entry["tabelle"]))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Daten erfolgreich aktualisiert!"})

    except Exception as e:
        print("Fehler beim Aktualisieren:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedule-data', methods=['GET'])
def get_schedule_data():
    conn = get_db_connection("gemeinsam", "192.168.0.11")
    cursor = conn.cursor()

    # Fetch all table metadata
    query = """
        SELECT 
            tabelle, feldbeschreibung, beispiel, bemerkung
        FROM tbl_customizing
    """
    
    cursor.execute(query)
    result = cursor.fetchall()
    cursor.close()
    conn.close()

    table_records = {}

    for row in result:
        table_name = row[0]
        feldbeschreibung = row[1]
        beispiel = row[2] if row[2] else ""
        bemerkung = row[3] if row[3] else ""

        if table_name not in table_records:
            table_records[table_name] = {
                "strang": "",
                "tabelle": table_name,
                "name": "",
                "letzterAbzug": "",
                "uhrzeit": "",
                "user": "",
                "protokoll": "",
                "tage": None,
                "nextDate": ""
            }

        if feldbeschreibung == "Strang":
            table_records[table_name]["strang"] = beispiel
        elif feldbeschreibung == "Tabellenname":
            table_records[table_name]["name"] = beispiel
        elif feldbeschreibung == "Name Fehlerprotokoll":
            table_records[table_name]["protokoll"] = beispiel
        elif feldbeschreibung == "Aktualisierung (Tage)" and beispiel.isdigit():
            table_records[table_name]["tage"] = int(beispiel)

    # Fetch upload logs for each table
    for table_name, record in table_records.items():
        upload_log = get_upload_logs(table_name)
        record.update(upload_log)

        # Calculate "Next Date"
        if record["letzterAbzug"] and record["tage"]:
            try:
                last_date = datetime.strptime(record["letzterAbzug"], "%d.%m.%Y")
                next_date = last_date + timedelta(days=record["tage"])
                record["nextDate"] = next_date.strftime("%d.%m.%Y")
            except ValueError:
                record["nextDate"] = "Invalid Date"

    return jsonify(list(table_records.values()))



if __name__ == '__main__':
    app.run(app)
