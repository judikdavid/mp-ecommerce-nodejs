require('dotenv').config()
var express = require('express');
var exphbs = require('express-handlebars');
var port = process.env.PORT || 3000
const mercadopago = require('mercadopago');
const { access_token, integrator_id, host, external_reference } = process.env

mercadopago.configure({
    access_token,
    integrator_id,
});

var app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    const { title, unit, price, img } = req.query
    // Create a preference object
    const id = 1234
    const unit_price = Number(price)
    const quantity = Number(unit)
    const description = 'Dispositio móvil de Tienda e-commerce'
    const picture_url = `${host}${img}`

    let preference = {
        items: [
            {
                id,
                title,
                unit_price,
                quantity,
                description,
                picture_url,
            }
        ],
        "payer": {
            "name": "Lalo",
            "surname": "Landa",
            "email": "test_user_81131286@testuser.com",
            "phone": {
                "area_code": "11",
                "number": 44444444
            },
            "identification": {
                "type": "DNI",
                "number": "12345678"
            },
            "address": {
                "street_name": "Falsa",
                "street_number": 123,
                "zip_code": "5700"
            }
        },
        "payment_methods": {
            "excluded_payment_methods": [
                {
                    // TODO: change to visa
                    "id": "master"
                }
            ],
            "excluded_payment_types": [
                {
                    "id": "ticket"
                }
            ],
            "installments": 6
        },
        "back_urls": {
            "success": `${host}/feedback`,
            "failure": `${host}/feedback`,
            "pending": `${host}/feedback`,
        },
        auto_return: "approved",
        "notification_url": `${host}/ipn`,
        external_reference,
    };

    mercadopago.preferences.create(preference)
        .then(function (response) {
            console.log(response)
            // This value replaces the String "<%= global.id %>" in your HTML
            return res.render('detail', { ...req.query, preference: response.body.id, init_point: response.body.init_point })
        }).catch(function (error) {
            console.log(error);
        });

});

app.get('/feedback', function (req, res) {
    res.json({
        Payment: req.query.payment_id,
        Status: req.query.status,
        MerchantOrder: req.query.merchant_order_id,
        ExternalReference: req.query.external_reference,
        SiteId: req.query.site_id,
        PreferenceId: req.query.preference_id,
    });
});

app.get('/ipn', function (req, res) {
    console.log(req)
});

app.listen(port);