const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');


require('dotenv').config();

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
    origin:process.env.FRONTEND_URL || 'http://localhost:5500'
}));

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST, 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE, 
    port: process.env.MYSQL_PORT 
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err.stack);
        return;
    }
    console.log('Conectado ao MySQL com o ID:', db.threadId);
});


    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Erro: Apenas imagens (jpeg, jpg, png, gif) são permitidas');
    }
});


// POST (cadastrar)

app.post('/usuarios', upload.single('foto_perfil_file'), async (req, res) => {
    const { nome_completo, idade, rua, bairro, estado, biografia, senha } = req.body;
    const foto_perfil_path = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nome_completo || !idade || !rua || !bairro || !estado || !senha) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        const hashedSenha = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO usuario (nome_completo, idade, rua, bairro, estado, biografia, foto_perfil, senha)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [nome_completo, idade, rua, bairro, estado, biografia, foto_perfil_path, hashedSenha];

        db.query(query, values, (err, result) => {
            if (err) {
                if (req.file) fs.unlinkSync(req.file.path);
                console.error('Erro ao cadastrar:', err);
                return res.status(500).json({ message: 'Erro ao cadastrar usuário.', error: err.message });
            }

            res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: result.insertId });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao processar senha.', error: error.message });
    }
});


//GET (buscar usuário pelo id)
app.get('/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT id, nome_completo, idade, rua, bairro, estado, biografia, foto_perfil FROM usuario WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário no banco de dados:', err);
            return res.status(500).json({ message: 'Erro ao buscar usuário.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json(results[0]);
    });
});




// POST (login)
app.post('/login', (req, res) => {
    const { nome_completo, senha } = req.body;

    if (!nome_completo || !senha) {
        return res.status(400).json({ message: 'Nome e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM usuario WHERE nome_completo = ? LIMIT 1';
    db.query(query, [nome_completo], async (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        res.status(200).json({ message: 'Login bem-sucedido!', id: usuario.id });
    });
});


// PUT (atualizar usuário por id)
app.put('/usuarios/:id', upload.single('foto_perfil_file'), (req, res) => {
    const userId = req.params.id;
    const { nome_completo, idade, rua, bairro, estado, biografia } = req.body;

    let nova_foto_perfil_path = req.file ? `/uploads/${req.file.filename}` : null;
    let foto_para_salvar_no_db = nova_foto_perfil_path;

    const executeUpdate = (currentFotoPerfil = null) => {
        if (!req.file) {
            foto_para_salvar_no_db = currentFotoPerfil;
        }

        const updateFields = [];
        const updateValues = [];

        if (nome_completo !== undefined) { updateFields.push('nome_completo = ?'); updateValues.push(nome_completo); }
        if (idade !== undefined) { updateFields.push('idade = ?'); updateValues.push(idade); }
        if (rua !== undefined) { updateFields.push('rua = ?'); updateValues.push(rua); }
        if (bairro !== undefined) { updateFields.push('bairro = ?'); updateValues.push(bairro); }
        if (estado !== undefined) { updateFields.push('estado = ?'); updateValues.push(estado); }
        if (biografia !== undefined) { updateFields.push('biografia = ?'); updateValues.push(biografia); }

        updateFields.push('foto_perfil = ?');
        updateValues.push(foto_para_salvar_no_db);

        updateValues.push(userId);

        const updateQuery = `
            UPDATE usuario
            SET
                ${updateFields.join(', ')}
            WHERE id = ?
        `;

        db.query(updateQuery, updateValues, (err, result) => {
            if (err) {
                console.error('Erro ao atualizar usuário no banco de dados:', err);
                if (req.file) { 
                    require('fs').unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: 'Erro ao atualizar usuário.', error: err.sqlMessage || err.message });
            }

            if (result.affectedRows === 0) {
                if (req.file) { 
                    require('fs').unlinkSync(req.file.path);
                }
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            res.status(200).json({
                message: 'Usuário atualizado com sucesso!',
                foto_url: foto_para_salvar_no_db ? `${process.env.BACKEND_URL || 'http://localhost:3000'}${foto_para_salvar_no_db}` : null
        });
    });
    };

    if (req.file) {
        db.query('SELECT foto_perfil FROM usuario WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar foto antiga para deletar:', err);
                return executeUpdate(); 
            }

            if (results.length > 0 && results[0].foto_perfil) {
                const fotoAntigaPath = path.join(__dirname, results[0].foto_perfil);
                if (require('fs').existsSync(fotoAntigaPath)) {
                    require('fs').unlink(fotoAntigaPath, (unlinkErr) => {
                        if (unlinkErr) console.error('Erro ao deletar foto antiga:', unlinkErr);
                        executeUpdate(null);
                    });
                } else {
                    executeUpdate(null);
                }
            } else {
                executeUpdate(null);
            }
        });
    } else {
        db.query('SELECT foto_perfil FROM usuario WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar foto existente para atualização:', err);
                return executeUpdate(null);
            }
            let currentFotoPerfil = null;
            if (results.length > 0) {
                currentFotoPerfil = results[0].foto_perfil;
            }
            executeUpdate(currentFotoPerfil);
        });
    }
});

// DELETE (apagar usuário por ID)
app.delete('/usuarios/:id', (req, res) => {
    const userId = req.params.id;

    db.query('SELECT foto_perfil FROM usuario WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar foto de perfil para exclusão:', err);
            return res.status(500).json({ message: 'Erro ao tentar excluir usuário.' });
        }

        let fotoPerfilPath = null;
        if (results.length > 0 && results[0].foto_perfil) {
            fotoPerfilPath = path.join(__dirname, results[0].foto_perfil);
        }

        const deleteQuery = 'DELETE FROM usuario WHERE id = ?';
        db.query(deleteQuery, [userId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Erro ao deletar usuário do banco de dados:', deleteErr);
                return res.status(500).json({ message: 'Erro ao deletar usuário.', error: deleteErr.message });
            }

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
            }

            if (fotoPerfilPath && fs.existsSync(fotoPerfilPath)) {
                fs.unlink(fotoPerfilPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Erro ao deletar arquivo de foto de perfil:', unlinkErr);
                    }
                    console.log('Foto de perfil deletada:', fotoPerfilPath);
                });
            }

            res.status(200).json({ message: 'Usuário e sua foto de perfil deletados com sucesso.' });
        });
    });
});


const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
