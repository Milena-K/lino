import * as opaque from "@serenity-kit/opaque"
import * as forge from "node-forge"
import * as openpgp from 'openpgp';
// import hkdf from 'js-crypto-hkdf'
import {RSA_algorithm,
        wrapCryptoKey,
        getKeyMaterial,
        getKey,
        unwrapPrivateKey,
        bytesToHex,
       } from "./crypto"


const URL_BASE_STR = "http://localhost:8000/auth"

var LLM_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEato/vBYJKwYBBAHaRw8BAQdAFeBwi4/eqSTcolri4lXH5/F9BdhyTgO7cI/8
yV3S8d60J01pbGVuYSBLdWtvbGogPHB1YmxpY19taWxlbmFAcHJvdG9uLm1lPoiQ
BBMWCgA4FiEEbQ46OTE1h4cI+9mMLkl0O+s2ltoFAmraP7wCGwEFCwkIBwIGFQoJ
CAsCBBYCAwECHgECF4AACgkQLkl0O+s2ltrZxQD/cQ+wie6ZIrgaXdRIPF8pjAgP
ohMAAuz6rbe46cYwfQUA/Rvi1z9A2S7noB/cbqR+Vu2VWOE7Hp68KCLCvhb05yMI
uDgEato/vBIKKwYBBAGXVQEFAQEHQB9M8/FvSDIjtf+hUMg1Xd0TfognegOMa2GC
2w7DfFJsAwEIB4h4BBgWCgAgFiEEbQ46OTE1h4cI+9mMLkl0O+s2ltoFAmraP7wC
GwwACgkQLkl0O+s2ltpxHwEAjZqWtgp+omRVFbgUk6nCt3cb79WRcrVkBjFHsfWV
QGgA/2avQU35IQAQPFKEbhg90ZHZtR3uNfzVjjOxaIgXJ9sL
=T5K+
-----END PGP PUBLIC KEY BLOCK-----`





onmessage = async (e) => {
    var action = e.data.action
    var cleanKey = LLM_PUBLIC_KEY
    .split("\n")
    .map(l => l.replace(/^\s+/, ""))   
    .join("\n");

    const publicKey = await openpgp.readKey({ armoredKey: cleanKey });
    console.log("fingerprints")
    console.log(publicKey.getFingerprint())

    const secret = await openpgp.encrypt({
        encryptionKeys: publicKey,
        message: await openpgp.createMessage({ text: e.data.secret }),
    })
    console.log(secret)
    var res = await fetch("http://localhost:8000/chat/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: secret })
    })
    if (!res.ok) {
        console.log(res.status, JSON.stringify(await res.json(), null, 2));
        return;
    }
    console.log(await res.json());
}
