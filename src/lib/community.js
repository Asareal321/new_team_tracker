import { supabase } from '../supabase'

// Every cross-user read and write in the community goes through a SECURITY
// DEFINER function — see migration-community.sql for why. This file is the
// thin layer that calls them, so no component has to know that.

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(friendly(error))
  return data
}

// Postgres raises these as plain exceptions, which arrive as
// "…: not enough coins". The part after the last colon is the sentence the
// function actually wrote; anything else is machinery.
function friendly(error) {
  const raw = error?.message || 'Something went wrong.'
  const known = [
    'not signed in', 'cannot friend yourself', 'no such request', 'no such listing',
    'that flower is not yours', 'you have none of those', 'price must be above zero',
    'that has already gone', 'that is your own listing', 'not enough coins',
  ]
  const hit = known.find(k => raw.includes(k))
  if (!hit) return raw
  return hit.charAt(0).toUpperCase() + hit.slice(1) + '.'
}

// — the directory —

export const browseProfiles = (limit = 50, offset = 0) =>
  rpc('browse_profiles', { _limit: limit, _offset: offset })

export const searchProfiles = query => rpc('search_profiles', { _query: query })

// — friends —

export const myFriends = () => rpc('my_friends')
export const requestFriend = addressee => rpc('request_friend', { _addressee: addressee })
export const respondFriend = (id, accept) => rpc('respond_friend', { _id: id, _accept: accept })
export const unfriend = other => rpc('unfriend', { _other: other })

export const friendGarden = userId => rpc('friend_garden', { _user_id: userId })

// — the market —

export const marketOpen = (limit = 60, offset = 0) =>
  rpc('market_open', { _limit: limit, _offset: offset })

export const listFlower = (flowerId, price) =>
  rpc('list_flower', { _flower_id: flowerId, _price: price })

export const listPacket = (packetKey, price) =>
  rpc('list_packet', { _packet_key: packetKey, _price: price })

export const cancelListing = id => rpc('cancel_listing', { _id: id })
export const buyListing = id => rpc('buy_listing', { _id: id })

// — your own profile —

export async function getVisibility(userId) {
  const { data, error } = await supabase
    .from('profiles').select('is_public').eq('id', userId).maybeSingle()
  if (error) throw new Error(friendly(error))
  return !!data?.is_public
}

export async function setVisibility(userId, isPublic) {
  const { error } = await supabase
    .from('profiles').update({ is_public: isPublic }).eq('id', userId)
  if (error) throw new Error(friendly(error))
}

// The database has none of this until migration-community.sql is run, and the
// error it raises then is about a missing function rather than anything the
// reader did. Recognised here so the UI can say which file to run instead.
export function isUnmigrated(error) {
  const m = String(error?.message || error || '')
  return m.includes('Could not find the function')
    || m.includes('does not exist')
    || m.includes('schema cache')
}
