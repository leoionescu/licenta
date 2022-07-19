import { createRequire } from "module";
const require = createRequire(import.meta.url);
import express from 'express';
import { Contact, User } from './repository.mjs'
const router = express.Router()
const { uuid } = require('uuidv4');
import { isOnline } from './index.js'
import { Contract } from "ethers";


const valid = (Model, data) => {
    return true
} 

const getRecords = async (Model, req, res) => {
    try {
        let contacts = await Model.findAll()
        if (contacts.length > 0) {
            res.status(200).json(contacts)
        } else {
            res.status(204).send()
        }
    } catch (err) {
        console.log('error: ' + err)
        res.status(500).send()
    }
}

const postRecord = async (Model, req, res) => {
    try {
        if (valid(Model, req.body)) {
            let record = await Model.create(req.body)
            res.status(201).location(`http://${req.headers.host}${req.baseUrl}${req.url}/${record.id}`).send()
        } else {
            res.status(400).send()
        }
    }  catch (err) {
        console.log(err.errors[0].message)
        res.status(500).json(err.errors[0].message)
    }
}

const deleteRecord = async (Model, req, res) => {
    try {
        let contact = await Model.findByPk(req.params.email)
        if (contact) {
            await contact.destroy()
            res.status(204).send()
        } else {
            res.status(404).send()
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

const deleteRecords = async(Model, req, res) => {
    try {
        await Model.truncate()
        res.status(204).send()
    } catch (error) {
        res.status(500).json(error)
    }
}

const getContacts = async (req, res) => {
    console.log('email user: ' + req.params.email)
    try {
        let contacts = await Contact.findAll({
            where: {
            contactId: req.params.email
            }
        })
        console.log('contacts length: ' + contacts.length)
        if (contacts.length > 0) {
            for (let contact of contacts) {
                let online = await isOnline(contact.email)
                console.log('isOnline: ' + online)
                contact.dataValues.isOnline = online
            }
            res.status(200).json(contacts)
        } else {
            res.status(204).send()
        }
    } catch (error) {
        res.status(500).json(error)
    }
}

const postContact = async (req, res) => {
    console.log('email user: ' + req.params.email)
    try {
        let user = await User.findByPk(req.params.email)
        if (user) {
            let contact = await Contact.create({
                email: req.body.email,
                name: req.body.name
            })
            if (user) {
                contact.setUser(user)
                res.status(204).send()
            } else {
                res.status(404).send()
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
}

router.route('/createRoom').get(async (req, res) => {
    let roomId = uuid()
    console.log('new room: ' + roomId)
    res.send({roomId})
  })

router.route('/users')
    .get(async (req, res) => getRecords(User, req, res))
    .post(async (req, res) => postRecord(User, req, res))
    .delete(async (req, res) => deleteRecords(User, req, res))

router.route('/contacts/:email')
    .get(async (req, res) => getContacts(req, res))
    .post(async (req, res) => postContact(req, res))
    .delete(async (req, res) => deleteRecord(Contact, req, res))


export default router;