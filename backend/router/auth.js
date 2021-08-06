const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../services/auth');
const verifyToken = require('../services/verify');

router.get('/', (req, res) => {
    res.status(200)
    res.json({ message: 'User System Online', status: 200 })
})

router.post('/login', (req, res) => {

    const { email, password } = req.body

    if (!email && !password) {
        return res.json({ message: 'E-Posta ve Şifre eksik' })
    }
    if (!email) {
        return res.json({ message: 'E-Posta eksik' })
    }
    if (!password) {
        return res.json({ message: 'Şifre Eksik' })
    }
    if (validateEmail(email) === false) {
        return res.json({
            message: 'Bu bir E-Posta değil!'
        })
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            auth.pwdecode(user.password, password).then(match => {
                if (match === true) {

                    const payload = {
                        name: user.name,
                        email: user.email,
                    }

                    auth.encode(payload).then(token => {
                        return res.json({
                            message: 'success',
                            token: token
                        })
                    })
                } else {
                    return res.json({
                        message: 'Şifre Yanlış!'
                    })
                }
            })
        } else {
            return res.json({ message: 'Bu E-Posta kayıtlı Değil' })
        }
    })


})

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}


router.post('/register', (req, res) => {
    const { name, email, password } = req.body
    if (!name && !email && !password) {
        return res.json({
            message: 'Lütfen hepsini doldurun'
        })
    }
    if (!name || !email || !password) {
        return res.json({
            message: 'Lütfen eksiksiz doldurun'
        })
    }
    if (name) {
        if (name.length < 3) {
            return res.json({
                message: 'Kullanıcı adı en az 3 karakter olabilir'
            })
        }

        if (name.length > 32) {
            return res.json({
                message: 'Kullanıcı adı en fazla 32 karakter olabilir'
            })
        }
    }
    if (email) {
        if (email.length < 3) {
            return res.json({
                message: 'E-Posta en az 3 karakter olabilir'
            })
        }

        if (email.length > 100) {
            return res.json({
                message: 'E-Posta en fazla 100 karakter olabilir'
            })
        }

        if (validateEmail(email) === false) {
            return res.json({
                message: 'Bu bir E-Posta değil!'
            })
        }
    }
    if (password) {
        if (password.length < 6) {
            return res.json({
                message: 'Şifre en az 6 karakter olabilir'
            })
        }
        if (password.length > 100) {
            return res.json({
                message: 'Şifre en fazla 100 karakter olabilir'
            })
        }
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            return res.json({
                message: 'Bu E-Posta zaten kayıtlı'
            })
        } else {
            auth.pwencode(password).then(newpw => {
                const NewUser = new User({
                    name: name,
                    email: email,
                    password: newpw
                })

                NewUser.save().then(user => {
                    const payload = {
                        name: user.name,
                        email: user.email,
                    }

                    auth.encode(payload).then(token => {
                        res.json({
                            message: 'success',
                            token: token,
                        })
                    })
                })
            })
        }




    })

})


router.get('/me', verifyToken, (req, res) => {
    auth.decode(req.token).then(user => {

        if(user.email){
            User.findOne({ email: user.email }).then(user => {
                res.json({ 
                    message: 'success',
                    name: user.name,
                    email: user.email,
                    admin: user.admin,
                    date: user.date,
                    ban: user.ban
                })
            })
        }else {
            res.json({
                message: 'Hatalı Token!'
            })
        }

    })
})


module.exports = router;