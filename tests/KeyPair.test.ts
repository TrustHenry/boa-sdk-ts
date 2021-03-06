/*******************************************************************************

    Test for KeyPair, PublicKey, SecretKey and Seed

    Copyright:
        Copyright (c) 2020 BOS Platform Foundation Korea
        All rights reserved.

    License:
        MIT License. See LICENSE for details.

*******************************************************************************/

import * as boasdk from '../lib';

import * as assert from 'assert';
import { base32Encode, base32Decode } from '@ctrl/ts-base32';

describe ('ED25519 Public Key', () =>
{
    before('Wait for the package libsodium to finish loading', () =>
    {
        return boasdk.SodiumHelper.init();
    });

    it ('Extract the public key from a string then convert it back into a string and compare it.', () =>
    {
        let address = 'GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW';
        let public_key = new boasdk.PublicKey(address);
        assert.strictEqual(public_key.toString(), address);
    });

    it ('Test of PublicKey.validate()', () =>
    {
        assert.strictEqual(boasdk.PublicKey.validate("GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQF"), 'Decoded data size is not normal');
        assert.strictEqual(boasdk.PublicKey.validate("SDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW"), 'This is not a valid address type');
        assert.strictEqual(boasdk.PublicKey.validate("GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW"), '');

        const decoded = Buffer.from(base32Decode("GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW"));
        const body = decoded.slice(0, -2);
        const checksum = decoded.slice(-2);
        let invalid_decoded = Buffer.concat([body, checksum.map(n => ~n)]);
        let invalid_address = base32Encode(invalid_decoded);
        assert.strictEqual(boasdk.PublicKey.validate(invalid_address), 'Checksum result do not match');
    });
});

describe ('ED25519 Secret Key Seed', () =>
{
    it ('Extract the seed from a string then convert it back into a string and compare it.', () =>
    {
        let secret_seed = 'SBBUWIMSX5VL4KVFKY44GF6Q6R5LS2Z5B7CTAZBNCNPLS4UKFVDXC7TQ';
        let seed = new boasdk.Seed(secret_seed);
        assert.strictEqual(seed.toString(), secret_seed);
    });

    it ('Test of Seed.validate()', () =>
    {
        assert.strictEqual(boasdk.Seed.validate("SBBUWIMSX5VL4KVFKY44GF6Q6R5LS2Z5B7CTAZBNCNPLS4UKFVDXC7T"), 'Decoded data size is not normal');
        assert.strictEqual(boasdk.Seed.validate("GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW"), 'This is not a valid seed type');
        assert.strictEqual(boasdk.Seed.validate("SBBUWIMSX5VL4KVFKY44GF6Q6R5LS2Z5B7CTAZBNCNPLS4UKFVDXC7TQ"), '');

        const decoded = Buffer.from(base32Decode("SBBUWIMSX5VL4KVFKY44GF6Q6R5LS2Z5B7CTAZBNCNPLS4UKFVDXC7TQ"));
        const body = decoded.slice(0, -2);
        const checksum = decoded.slice(-2);
        let invalid_decoded = Buffer.concat([body, checksum.map(n => ~n)]);
        let invalid_seed = base32Encode(invalid_decoded);
        assert.strictEqual(boasdk.Seed.validate(invalid_seed), 'Checksum result do not match');
    });
});

describe ('KeyPair', () =>
{
    // See: https://github.com/bpfkorea/agora/blob/93c31daa616e76011deee68a8645e1b86624ce3d/source/agora/common/crypto/Key.d#L375-L386
    it ('Test of KeyPair.fromSeed, sign, verify', () =>
    {
        let address = `GDD5RFGBIUAFCOXQA246BOUPHCK7ZL2NSHDU7DVAPNPTJJKVPJMNLQFW`;
        let seed = `SBBUWIMSX5VL4KVFKY44GF6Q6R5LS2Z5B7CTAZBNCNPLS4UKFVDXC7TQ`;

        let kp = boasdk.KeyPair.fromSeed(new boasdk.Seed(seed));
        assert.strictEqual(kp.address.toString(), address);

        let signature = kp.secret.sign(Buffer.from('Hello World'));
        assert.ok(kp.address.verify(signature, Buffer.from('Hello World')));
    });

    it ('Test of KeyPair.random, sign, verify, reproduce', () =>
    {
        let random_kp = boasdk.KeyPair.random();

        let random_kp_signature = random_kp.secret.sign(Buffer.from('Hello World'));
        assert.ok(random_kp.address.verify(random_kp_signature, Buffer.from('Hello World')));

        // Test whether randomly generated key-pair are reproducible.
        let reproduced_kp = boasdk.KeyPair.fromSeed(random_kp.seed);

        let reproduced_kp_signature = reproduced_kp.secret.sign(Buffer.from('Hello World'));
        assert.ok(reproduced_kp.address.verify(reproduced_kp_signature, Buffer.from('Hello World')));

        assert.deepStrictEqual(random_kp.secret, reproduced_kp.secret);
        assert.deepStrictEqual(random_kp.address, reproduced_kp.address);
        assert.deepStrictEqual(random_kp_signature, reproduced_kp_signature);
    });
});
