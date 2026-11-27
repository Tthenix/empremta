import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.js';

if (config.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS visitors (
  pubkey TEXT PRIMARY KEY,
  onboard_tx TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS visits (
  pubkey TEXT,
  stop_id TEXT,
  tx_hash TEXT,
  created_at INTEGER,
  UNIQUE(pubkey, stop_id)
);
CREATE TABLE IF NOT EXISTS payments (
  tx_hash TEXT PRIMARY KEY,
  ref TEXT,
  pubkey TEXT,
  merchant_id TEXT,
  amount TEXT,
  discount TEXT,
  to_merchant TEXT,
  to_centro TEXT,
  huellas_burned INTEGER,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS demo_funds (
  pubkey TEXT PRIMARY KEY,
  tx_hash TEXT,
  created_at INTEGER
);
`);

export function recordVisitor(pubkey, onboardTx) {
  db.prepare('INSERT OR IGNORE INTO visitors (pubkey, onboard_tx, created_at) VALUES (?, ?, ?)')
    .run(pubkey, onboardTx || null, Date.now());
}

export function getVisitor(pubkey) {
  return db.prepare('SELECT * FROM visitors WHERE pubkey = ?').get(pubkey) || null;
}

export function hasVisit(pubkey, stopId) {
  return Boolean(db.prepare('SELECT 1 FROM visits WHERE pubkey = ? AND stop_id = ?').get(pubkey, stopId));
}

export function recordVisit({ pubkey, stopId, txHash }) {
  db.prepare('INSERT INTO visits (pubkey, stop_id, tx_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(pubkey, stopId, txHash, Date.now());
}

export function listVisits(pubkey) {
  return db.prepare('SELECT stop_id AS stopId, tx_hash AS txHash, created_at AS createdAt FROM visits WHERE pubkey = ? ORDER BY created_at ASC')
    .all(pubkey);
}

export function recordPayment({ txHash, ref, pubkey, merchantId, desglose }) {
  db.prepare(`INSERT INTO payments (
    tx_hash, ref, pubkey, merchant_id, amount, discount, to_merchant, to_centro, huellas_burned, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    txHash,
    ref,
    pubkey,
    merchantId,
    desglose.amount,
    desglose.discount,
    desglose.toMerchant,
    desglose.toCentro,
    desglose.huellasBurned,
    Date.now()
  );
}

export function hasPaymentRef(merchantId, ref) {
  return Boolean(db.prepare('SELECT 1 FROM payments WHERE merchant_id = ? AND ref = ?').get(merchantId, ref));
}

export function listMerchantPayments(merchantId, since = null) {
  const params = [merchantId];
  let sql = `SELECT tx_hash AS txHash, ref, amount, discount, to_merchant AS toMerchant,
    to_centro AS toCentro, huellas_burned AS huellasBurned, created_at AS createdAt
    FROM payments WHERE merchant_id = ?`;
  if (since !== null && since !== undefined && Number.isFinite(Number(since))) {
    sql += ' AND created_at > ?';
    params.push(Number(since));
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

export function listPayments() {
  return db.prepare(`SELECT tx_hash AS txHash, ref, pubkey, merchant_id AS merchantId, amount, discount,
    to_merchant AS toMerchant, to_centro AS toCentro, huellas_burned AS huellasBurned, created_at AS createdAt
    FROM payments ORDER BY created_at DESC`).all();
}

export function recordDemoFund(pubkey, txHash) {
  db.prepare('INSERT INTO demo_funds (pubkey, tx_hash, created_at) VALUES (?, ?, ?)')
    .run(pubkey, txHash, Date.now());
}

export function getDemoFund(pubkey) {
  return db.prepare('SELECT * FROM demo_funds WHERE pubkey = ?').get(pubkey) || null;
}
