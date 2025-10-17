import { playerMatchingService } from '../src/utils/playerMatching.js';
import { filter as filterPlayers } from '../src/api/entities/Player.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.body;

    switch (action) {
      case 'findMatches':
        return await handleFindMatches(req, res);
      case 'linkUser':
        return await handleLinkUser(req, res);
      case 'createPlayer':
        return await handleCreatePlayer(req, res);
      case 'search':
        return await handleSearch(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: findMatches, linkUser, createPlayer, search'
        });
    }
  } catch (error) {
    console.error('Player API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleFindMatches(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { playerInfo } = req.body;

  if (!playerInfo) {
    return res.status(400).json({
      success: false,
      error: 'Player information is required'
    });
  }

  try {
    const matches = await playerMatchingService.findPotentialMatches(playerInfo);
    
    return res.status(200).json({
      success: true,
      matches,
      count: matches.length,
      message: `Found ${matches.length} potential matches`
    });
  } catch (error) {
    console.error('Error finding matches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find potential matches',
      details: error.message
    });
  }
}

async function handleLinkUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { userId, playerId, userEmail, adminEmail } = req.body;

  if (!userId || !playerId || !userEmail || !adminEmail) {
    return res.status(400).json({
      success: false,
      error: 'userId, playerId, userEmail, and adminEmail are required'
    });
  }

  try {
    const result = await playerMatchingService.linkUserToPlayer(
      userId,
      playerId,
      userEmail,
      adminEmail
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error linking user to player:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to link user to player profile',
      details: error.message
    });
  }
}

async function handleCreatePlayer(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { userId, playerInfo, adminEmail } = req.body;

  if (!userId || !playerInfo || !adminEmail) {
    return res.status(400).json({
      success: false,
      error: 'userId, playerInfo, and adminEmail are required'
    });
  }

  if (!playerInfo.fullName || !playerInfo.phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'Player full name and phone number are required'
    });
  }

  try {
    const result = await playerMatchingService.createPlayerFromSignup(
      userId,
      playerInfo,
      adminEmail
    );
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating player from signup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create new player profile',
      details: error.message
    });
  }
}

async function handleSearch(req, res) {
  try {
    const { 
      name, 
      firstName, 
      lastName, 
      email, 
      phone, 
      schoolIRN, 
      schoolName,
      limit = 50 
    } = req.body;

    const filters = {};
    
    if (firstName) filters.firstName = firstName;
    if (lastName) filters.lastName = lastName;
    if (email) filters.emailAddress = email;
    if (phone) filters.phoneNumber = normalizePhoneNumber(phone);
    if (schoolIRN) filters.highSchoolIRN = schoolIRN;

    if (name && !firstName && !lastName) {
      const parsedName = parseFullName(name);
      if (parsedName.firstName) filters.firstName = parsedName.firstName;
      if (parsedName.lastName) filters.lastName = parsedName.lastName;
    }

    if (Object.keys(filters).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one search criterion is required (name, firstName, lastName, email, phone, schoolIRN)'
      });
    }

    const players = await filterPlayers(filters, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      players: players || [],
      count: (players || []).length,
      filters: filters,
      message: `Found ${(players || []).length} players matching criteria`
    });

  } catch (error) {
    console.error('Player search API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search players',
      details: error.message
    });
  }
}

function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/^1/, '');
}

function parseFullName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else if (parts.length >= 2) {
    return { 
      firstName: parts[0], 
      lastName: parts[parts.length - 1] 
    };
  }
  return { firstName: '', lastName: '' };
}