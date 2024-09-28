from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import log_preprocessing
import process_mining
from werkzeug.datastructures import FileStorage
import json
import io
import gzip

app = Flask(__name__)
CORS(app)


@app.route("/process-data", methods=["POST"])
def process_data():
    log_files = []
    regex_pattern = request.form.get("regex_pattern", "")

    i = 0
    while True:
        log_name_key = f"logs[{i}][name]"
        log_data_key = f"logs[{i}][data]"

        log_name = request.form.get(log_name_key)
        log_data = request.form.get(log_data_key)

        if log_name is None or log_data is None:
            break

        log_files.append((log_data, log_name))
        i += 1

    if not log_files or not regex_pattern:
        return jsonify({"error": "Missing required parameters"}), 400

    log_data, log_emitters = log_mining.process_logs(log_files, regex_pattern)

    bpmn_string = process_mining.extract_processes(log_data)

    # Create the combined JSON data
    combined_data = {
        "log_data": log_data,
        "log_emitters": log_emitters,
        "bpmn_model": bpmn_string,
    }

    # Convert JSON data to file
    data = json.dumps(combined_data)

    # Compress the JSON string with gzip
    compressed_data = gzip.compress(data.encode())

    # Convert bytes data to BytesIO
    data_bytes_io = io.BytesIO(compressed_data)

    return send_file(
        data_bytes_io,
        mimetype="application/gzip",
        as_attachment=True,
        download_name="logging_model.gz",
    )


if __name__ == "__main__":
    app.run(debug=True)
