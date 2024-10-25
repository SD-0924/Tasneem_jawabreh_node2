const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Home route to list files
app.get('/', (req, res) => {
    fs.readdir(path.join(__dirname, 'data'), (err, files) => {
        if (err) return res.render('index', { files: [], error: 'Unable to scan directory' });
        res.render('index', { files, error: null });
    });
});

// Route to show the file creation page
app.get('/create', (req, res) => {
    res.render('create', { error: null });
});

// Handle creating a new file with a check for existing files
app.post('/create', (req, res) => {
    const { filename, content } = req.body;
    const filepath = path.join(__dirname, 'data', filename);

    fs.access(filepath, fs.constants.F_OK, (err) => {
        if (!err) return res.render('create', { error: 'File already exists.' });
        
        fs.writeFile(filepath, content, (err) => {
            if (err) return res.render('create', { error: 'Error creating file' });
            res.redirect('/');
        });
    });
});

// View specific file content
app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'data', filename);
    fs.readFile(filepath, 'utf8', (err, content) => {
        if (err) return res.render('detail', { filename, content: null, error: 'File not found' });
        res.render('detail', { filename, content, error: null });
    });
});

// Handle file rename with existence check
app.post('/rename', (req, res) => {
    const { oldFilename, newFilename } = req.body;
    const oldPath = path.join(__dirname, 'data', oldFilename);
    const newPath = path.join(__dirname, 'data', newFilename);

    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) {
            // Re-read files to pass to the view
            fs.readdir(path.join(__dirname, 'data'), (err, files) => {
                if (err) return res.render('index', { files: [], error: 'Unable to scan directory' });
                res.render('index', { files, error: 'File not found.' });
            });
        } else {
            fs.access(newPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.readdir(path.join(__dirname, 'data'), (err, files) => {
                        if (err) return res.render('index', { files: [], error: 'Unable to scan directory' });
                        res.render('index', { files, error: 'New filename already exists.' });
                    });
                } else {
                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            fs.readdir(path.join(__dirname, 'data'), (err, files) => {
                                if (err) return res.render('index', { files: [], error: 'Unable to scan directory' });
                                res.render('index', { files, error: 'Error renaming file' });
                            });
                        } else {
                            res.redirect('/');
                        }
                    });
                }
            });
        }
    });
});

// Delete file route with check for file existence
app.post('/delete', (req, res) => {
    const filename = req.body.filename;
    const filepath = path.join(__dirname, 'data', filename);

    fs.access(filepath, fs.constants.F_OK, (err) => {
        if (err) return res.render('index', { error: 'File not found.' });

        fs.unlink(filepath, (err) => {
            if (err) return res.render('index', { error: 'Error deleting file' });
            res.redirect('/');
        });
    });
});

// Configure Multer for File Uploads
const upload = multer({
    dest: path.join(__dirname, 'data')  // Temporary storage path
});
app.get('/uploadfile', (req, res) => {
    res.render('uploadfile', { error: null });
});

// Route to Handle File Upload with existence check
app.post('/uploadfile', upload.single('file'), (req, res) => {
    const { file } = req;
    if (!file) {
        return res.render('uploadfile', { error: 'No file uploaded.' });
    }

    const newPath = path.join(__dirname, 'data', file.originalname);

    fs.access(newPath, fs.constants.F_OK, (err) => {
        if (!err) {
            return res.render('uploadfile', { error: 'File with the same name already exists.' });
        }

        fs.rename(file.path, newPath, (err) => {
            if (err) return res.render('uploadfile', { error: 'Error saving file.' });
            res.redirect('/');
        });
    });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
