import gnupg

gpg = gnupg.GPG(gnupghome="./gnupghome")
input_data = gpg.gen_key_input(
    key_type="ECDH",
    key_curve="cv25519",
    key_length=1024,
    name_real="lino",
    key_usage="encrypt",
)
key = gpg.gen_key(input_data)

ascii_armored_pub_key = gpg.export_keys(keyids="lino")
# After the key was generated,
# I was prompted to add a passphrase,
# however I didn't add one.
