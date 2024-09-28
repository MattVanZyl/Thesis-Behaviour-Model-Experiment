import re
from tqdm import tqdm
import concurrent.futures
from collections import defaultdict, Counter

# ======================================================================


def _extract_log_data(logs, regex_pattern, service_name):
    # Initialize an empty list to store the log messages
    log_data = []

    # Pre-compile the regex pattern
    pattern = re.compile(regex_pattern)

    # Split the log data into lines
    lines = logs.split("\n")

    # Loop through the lines of the file with a progress bar
    for line in tqdm(
        lines, total=len(lines), desc=f"Processing log data for {service_name}"
    ):
        # Match the log message with the regex pattern
        match = pattern.match(line)

        # If the line matches the pattern, extract the parts of the log message
        if match:
            log_message = match.groupdict()
            log_message["service"] = service_name
            log_data.append(log_message)
        else:
            # If the line doesn't match the pattern, append it to the previous log message
            if log_data:
                log_data[-1]["message"] += line.strip()

    return log_data


# ======================================================================


def _extract_log_emitters(log_data):
    # Group the logs by "logger_name", "service", and "template"
    log_groups = defaultdict(list)
    for log in log_data:
        key = (log["logger_name"], log["service"], log["file"], log["line_number"])
        log_groups[key].append(log)

    # Assign an emitter ID to each unique combination and count their occurrences
    log_emitters = []
    emitter_id = 1
    emitter_id_mapping = {}
    for key, logs in tqdm(log_groups.items(), desc="Assigning emitter IDs"):
        logger_name, service, file, line_number = key
        emitter = {
            "emitter_id": emitter_id,
            "logger_name": logger_name,
            "service": service,
            # "template": template,
            "file": file,
            "line_number": line_number,
            "count": len(logs),
        }
        log_emitters.append(emitter)
        emitter_id_mapping[key] = emitter_id
        emitter_id += 1

    # Assign the emitter ID to each log
    for log in tqdm(log_data, desc="Assigning emitter IDs to logs"):
        key = (log["logger_name"], log["service"], log["file"], log["line_number"])
        log["emitter_id"] = emitter_id_mapping[key]

    return log_data, log_emitters


# ======================================================================
def process_logs(log_files, regex_pattern):
    print("\n====== Extracting Log Data ======\n")
    # Initialize an empty list to store the combined log messages
    combined_log_data = []

    def process_log_file(args):
        log_file, service_name = args
        return _extract_log_data(log_file, regex_pattern, service_name)

    # Use a ThreadPoolExecutor to process the log files in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        for log_data in executor.map(process_log_file, log_files):
            combined_log_data.extend(log_data)

    # combined_log_data = _extract_log_templates(combined_log_data)

    # TODO: Change hard coded task
    specific_task = "Get Surveys"

    combined_log_data = [
        log for log in combined_log_data if log.get("task") == specific_task
    ]

    combined_log_data, log_emitters = _extract_log_emitters(combined_log_data)

    return combined_log_data, log_emitters
