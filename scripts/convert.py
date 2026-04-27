import pandas as pd
import os

input_folder = "dataset/raw"
output_folder = "dataset/csv"

os.makedirs(output_folder, exist_ok=True)

for file in os.listdir(input_folder):
    if file.endswith(".txt"):
        file_path = os.path.join(input_folder, file)
        
        print(f"Processing {file}...")
        
        try:
            df = pd.read_csv(file_path, sep=r"\s+", header=None, engine="python")
            
            csv_path = os.path.join(output_folder, file.replace(".txt", ".csv"))
            df.to_csv(csv_path, index=False)
            
            print(f"Saved {file.replace('.txt', '.csv')}")
        
        except:
            print(f"Skipped {file}")

print("✅ Conversion done!")