from flask_frozen import Freezer
from app import app
import os
import shutil

# Configure Freezer
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_REMOVE_EXTRA_EXTENSIONS'] = False

freezer = Freezer(app)

@freezer.register_generator
def statistics():
    # Only freeze the default statistics page. 
    # Client-side JS will handle dynamic hashtag fetching.
    yield {'hashtag': 'hotosm'}

if __name__ == '__main__':
    # Build the static site
    print("Freezing Flask app...")
    freezer.freeze()
    
    # Post-processing: Add .html extensions to files without them
    # and create .nojekyll for GitHub Pages
    build_dir = os.path.join(os.path.dirname(__file__), 'build')
    
    # Create .nojekyll
    with open(os.path.join(build_dir, '.nojekyll'), 'w') as f:
        pass
        
    # Rename files like 'about' to 'about.html'
    for filename in os.listdir(build_dir):
        filepath = os.path.join(build_dir, filename)
        if os.path.isfile(filepath) and '.' not in filename:
            print(f"Renaming {filename} to {filename}.html")
            os.rename(filepath, filepath + '.html')

    # Copy the data directory to the build folder manually
    src_data = os.path.join(os.path.dirname(__file__), 'data')
    dest_data = os.path.join(build_dir, 'data')
    
    if os.path.exists(src_data):
        print(f"Copying {src_data} to {dest_data}...")
        if os.path.exists(dest_data):
            shutil.rmtree(dest_data)
        shutil.copytree(src_data, dest_data)
        
    print("Build complete! Files are in the 'build' directory.")
