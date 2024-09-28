import pandas as pd
import pm4py
from tqdm.notebook import tqdm

from io import StringIO
import os


def extract_processes(log_data):
    print("\n====== Extracting Process Models ======\n")
    # Convert the JSON logs to a pandas DataFrame
    logs_df = pd.DataFrame(log_data)

    # Make sure the 'timestamp' column is in datetime format
    logs_df['timestamp'] = pd.to_datetime(logs_df['timestamp'])
    logs_df['emitter_id'] = logs_df['emitter_id'].astype(str)

    case_id_key = 'pid'
    timestamp_key = 'timestamp'
    # activity_key = 'logger_name'
    activity_key = 'emitter_id'

    bpmn_model = pm4py.discover_bpmn_inductive(
        logs_df, activity_key=activity_key, case_id_key=case_id_key, timestamp_key=timestamp_key)

    # Define a temporary filename
    temp_filename = 'temp.bpmn'

    # Write the BPMN model to a temporary file
    pm4py.write.write_bpmn(bpmn_model, temp_filename)

    # Read the BPMN model from the file into a string
    with open(temp_filename, 'r') as file:
        bpmn_string = file.read()

    # Delete the temporary file
    os.remove(temp_filename)

    return bpmn_string
