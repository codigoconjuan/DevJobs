const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El archivo es muy grande: Máximo 100kb ');
                } else {
                    req.flash('error', error.message);
                }
            } else {
                req.flash('error', error.message);
            }
            res.redirect('/administracion');
            return;
        } else {
            return next();
        }
    });
}
// Opciones de Multer
const configuracionMulter = {
    limits : { fileSize : 100000 },
    storage: fileStorage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/perfiles');
        }, 
        filename : (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ) {
            // el callback se ejecuta como true o false : true cuando la imagen se acepta
            cb(null, true);
        } else {
            cb(new Error('Formato No Válido'));
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crea tu cuenta en devJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}



exports.validarRegistro = (req, res, next) => {

    // sanitizar
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    req.sanitizeBody('password').escape();
    req.sanitizeBody('confirmar').escape();

    // validar
    req.checkBody('nombre', 'El Nombre es Obligatorio').notEmpty();
    req.checkBody('email', 'El email debe ser valido').isEmail();
    req.checkBody('password', 'El password no puede ir vacio').notEmpty();
    req.checkBody('confirmar', 'Confirmar password no puede ir vacio').notEmpty();
    req.checkBody('confirmar', 'El password es diferente').equals(req.body.password);

    const errores = req.validationErrors();

    if(errores){
        // si hay errores
        req.flash('error', errores.map(error => error.msg));

        res.render('crear-cuenta', {
            nombrePagina: 'Crea tu cuenta en devJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',mensajes: req.flash()
        });
        return;
    }

    // Si toda la validación es correcta
    next();
}

exports.crearUsuario = async (req, res, next) => {
    // crear el usuario
    const usuario = new Usuarios(req.body);
    try {
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }
}

// formulario para iniciar sesión
exports.formIniciarSesion = (req, res ) => {
    res.render('iniciar-sesion', {
        nombrePagina : 'Iniciar Sesión devJobs'
    })
}

// Form editar el Perfil
exports.formEditarPerfil = (req, res) => {
    res.render('editar-perfil', {
        nombrePagina : 'Edita tu perfil en devJobs',
        usuario: req.user,
        cerrarSesion: true,
        nombre : req.user.nombre,
        imagen : req.user.imagen
    })
}
// Guardar cambios editar perfil
exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if(req.body.password) {
        usuario.password = req.body.password
    }

    if(req.file) {
        usuario.imagen = req.file.filename;
    }

    await usuario.save();

    req.flash('correcto', 'Cambios Guardados Correctamente');
    // redirect
    res.redirect('/administracion');
}

// sanitizar y validar el formulario de editar perfiles
exports.validarPerfil = (req, res, next) => {
    // sanitizar
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    if(req.body.password){
        req.sanitizeBody('password').escape();
    }
    // validar
    req.checkBody('nombre', 'El nombre no puede ir vacio').notEmpty();
    req.checkBody('email', 'El correo no puede ir vacio').notEmpty();

    const errores = req.validationErrors();

    if(errores) {
        req.flash('error', errores.map(error => error.msg));

        res.render('editar-perfil', {
            nombrePagina : 'Edita tu perfil en devJobs',
            usuario: req.user,
            cerrarSesion: true,
            nombre : req.user.nombre,
            imagen : req.user.imagen,
            mensajes : req.flash()
        })
    }
    next(); // todo bien, siguiente middleware!
}
