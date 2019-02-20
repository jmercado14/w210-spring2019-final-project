# This script can be used to convert the JSON chatroom records to a unified CSV.
# It relies on drop_duplicates to remove duplicates, 
# and drops objects as it goes along to conserve disc space.
# Replace the file paths with the appropriate file paths for your local system!

import pandas as pd
import json
import os
f1 = json.load(open(os.path.abspath("/Users/home/Downloads/all-posts-public-main-chatroom/freecodecamp_casual_chatroom_01.json")))
from pandas.io.json import json_normalize
json_normalize(f1).iloc[:, 1:].to_csv(os.path.abspath("/Users/home/Desktop/casual_chatroom_01.csv"))
del f1
f2 = json.load(open(os.path.abspath("/Users/home/Downloads/all-posts-public-main-chatroom/freecodecamp_casual_chatroom_02.json")))
json_normalize(f2).iloc[:, 1:].to_csv(os.path.abspath("/Users/home/Desktop/casual_chatroom_02.csv"))
del f2
f3 = json.load(open(os.path.abspath("/Users/home/Downloads/all-posts-public-main-chatroom/freecodecamp_casual_chatroom_03.json")))
json_normalize(f3).iloc[:, 1:].to_csv(os.path.abspath("/Users/home/Desktop/casual_chatroom_03.csv"))
del f3

pd.concat([pd.read_csv("/Users/home/Desktop/casual_chatroom_01.csv"), pd.read_csv("/Users/home/Desktop/casual_chatroom_02.csv"), pd.read_csv("/Users/home/casual_chatroom_03.csv")]).drop_duplicates().to_csv("/Users/home/Desktop/freecodecamp_casual_chatroom.csv")