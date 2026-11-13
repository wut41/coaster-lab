// after start-up: a link from an account email signs the player in; a link to a shared park opens it
TY10.booted = true; try { if (!(TY10.authLink && TY10.authLink())) TY10.deepLink && TY10.deepLink() } catch (e) { console.warn('10.0 link', e) }
