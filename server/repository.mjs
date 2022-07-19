import Sequelize from 'sequelize';
const { DataTypes } = Sequelize;

const sequelize = new Sequelize({
    storage: './database.db',
    dialect: 'sqlite',
    logging: false
});

const User = sequelize.define('user', {
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        },
        primaryKey: true
    }
})

const Contact = sequelize.define('contact', {
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }, 
        // primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true,
    }
})

User.hasMany(Contact, { foreignKey: 'contactId' })
Contact.belongsTo(User, { foreignKey: 'contactId' })

async function intitialize() {
    await sequelize.authenticate()
    await sequelize.sync({})
}

export {
    intitialize,
    User,
    Contact
}