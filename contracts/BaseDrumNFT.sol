// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BaseDrumNFT
 * @dev NFT contract for storing musical compositions generated from user blockchain data
 * Stores song patterns, effects, and metadata directly in contract storage
 */
contract BaseDrumNFT is ERC721, Ownable {
    using Strings for uint256;

    // Track data structure matching our songData format
    struct Track {
        uint16[] pattern;     // Array of step positions where notes play
        string[] notes;       // Note names for melodic tracks (empty for drums)
        uint8 volume;         // Volume level (0-100)
        bool muted;           // Whether track is muted
    }

    // Effects data structure
    struct Effects {
        uint16 filterCutoff;  // Filter cutoff (0-1000, represents 0.0-1.0)
        uint8 filterType;     // 0=lowpass, 1=highpass, 2=bandpass
        uint16 reverbWet;     // Reverb wet amount (0-1000, represents 0.0-1.0)
        uint8 reverbRoomSize; // Room size (0-100)
        uint16 reverbDecay;   // Decay time in tenths (20 = 2.0s)
    }

    // Song metadata
    struct SongMetadata {
        string title;
        uint16 bpm;           // Beats per minute
        uint8 bars;           // Number of bars
        uint8 steps;          // Total steps
        uint32 created;       // Timestamp
        address creator;      // Original creator
        uint32 creatorFid;    // Farcaster FID of creator
    }

    // Complete song structure
    struct Song {
        SongMetadata metadata;
        Effects effects;
        mapping(string => Track) tracks;  // Track name -> Track data
        string[] trackNames;              // Array of track names for iteration
    }

    // Storage
    mapping(uint256 => Song) public songs;
    uint256 private _nextTokenId = 1;
    uint256 public mintPrice = 0.001 ether; // Small mint fee
    
    // Events
    event SongMinted(
        uint256 indexed tokenId, 
        address indexed creator, 
        string title, 
        uint16 bpm, 
        uint8 bars
    );

    constructor() ERC721("BaseDrum Music NFT", "DRUM") Ownable(msg.sender) {}

    /**
     * @dev Mint a new music NFT with song data
     * @param metadata Song metadata
     * @param effects Audio effects settings
     * @param trackNames Array of track names
     * @param trackData Array of track data corresponding to trackNames
     */
    function mintSong(
        SongMetadata memory metadata,
        Effects memory effects,
        string[] memory trackNames,
        Track[] memory trackData
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(trackNames.length == trackData.length, "Track arrays length mismatch");
        require(trackNames.length > 0, "Must have at least one track");
        require(metadata.bpm > 0 && metadata.bpm <= 300, "Invalid BPM");
        require(metadata.bars > 0 && metadata.bars <= 32, "Invalid bar count");

        uint256 tokenId = _nextTokenId++;
        
        // Set metadata with creator info
        songs[tokenId].metadata = SongMetadata({
            title: metadata.title,
            bpm: metadata.bpm,
            bars: metadata.bars,
            steps: metadata.steps,
            created: uint32(block.timestamp),
            creator: msg.sender,
            creatorFid: metadata.creatorFid
        });

        // Set effects
        songs[tokenId].effects = effects;

        // Store tracks
        songs[tokenId].trackNames = trackNames;
        for (uint256 i = 0; i < trackNames.length; i++) {
            songs[tokenId].tracks[trackNames[i]] = trackData[i];
        }

        // Mint NFT
        _mint(msg.sender, tokenId);

        emit SongMinted(tokenId, msg.sender, metadata.title, metadata.bpm, metadata.bars);
        
        return tokenId;
    }

    /**
     * @dev Get song metadata
     */
    function getSongMetadata(uint256 tokenId) external view returns (SongMetadata memory) {
        require(_exists(tokenId), "Song does not exist");
        return songs[tokenId].metadata;
    }

    /**
     * @dev Get song effects
     */
    function getSongEffects(uint256 tokenId) external view returns (Effects memory) {
        require(_exists(tokenId), "Song does not exist");
        return songs[tokenId].effects;
    }

    /**
     * @dev Get track names for a song
     */
    function getTrackNames(uint256 tokenId) external view returns (string[] memory) {
        require(_exists(tokenId), "Song does not exist");
        return songs[tokenId].trackNames;
    }

    /**
     * @dev Get specific track data
     */
    function getTrack(uint256 tokenId, string memory trackName) 
        external view returns (Track memory) {
        require(_exists(tokenId), "Song does not exist");
        return songs[tokenId].tracks[trackName];
    }

    /**
     * @dev Get complete song data (metadata + effects + all tracks)
     * Returns data in chunks due to return size limits
     */
    function getSongData(uint256 tokenId) 
        external view 
        returns (
            SongMetadata memory metadata,
            Effects memory effects,
            string[] memory trackNames
        ) {
        require(_exists(tokenId), "Song does not exist");
        
        return (
            songs[tokenId].metadata,
            songs[tokenId].effects,
            songs[tokenId].trackNames
        );
    }

    /**
     * @dev Get all tracks for a song (call separately due to gas limits)
     */
    function getAllTracks(uint256 tokenId) 
        external view 
        returns (Track[] memory) {
        require(_exists(tokenId), "Song does not exist");
        
        string[] memory trackNames = songs[tokenId].trackNames;
        Track[] memory tracks = new Track[](trackNames.length);
        
        for (uint256 i = 0; i < trackNames.length; i++) {
            tracks[i] = songs[tokenId].tracks[trackNames[i]];
        }
        
        return tracks;
    }

    /**
     * @dev Get songs created by a specific address
     */
    function getSongsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 supply = _nextTokenId - 1;
        uint256[] memory tempResults = new uint256[](supply);
        uint256 count = 0;

        for (uint256 i = 1; i <= supply; i++) {
            if (_exists(i) && songs[i].metadata.creator == creator) {
                tempResults[count] = i;
                count++;
            }
        }

        // Create array with exact size
        uint256[] memory results = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = tempResults[i];
        }

        return results;
    }

    /**
     * @dev Get recent songs (last N songs)
     */
    function getRecentSongs(uint256 limit) external view returns (uint256[] memory) {
        uint256 supply = _nextTokenId - 1;
        uint256 returnCount = limit > supply ? supply : limit;
        uint256[] memory results = new uint256[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            results[i] = supply - i;
        }

        return results;
    }

    /**
     * @dev Get total number of minted songs
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Generate a playable URL for sharing (returns Base App URL)
     */
    function getShareableURL(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Song does not exist");
        
        // Return Base mini-app URL with tokenId parameter
        // Format: https://base.org/app/basedrum?play={tokenId}
        return string(abi.encodePacked(
            "https://base.org/app/basedrum?play=", 
            tokenId.toString()
        ));
    }

    /**
     * @dev Override tokenURI to return song metadata as JSON
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Song does not exist");
        
        SongMetadata memory metadata = songs[tokenId].metadata;
        
        string memory json = string(abi.encodePacked(
            '{"name": "', metadata.title,
            '", "description": "BaseDrum Music NFT - Generated from blockchain data",',
            '"attributes": [',
                '{"trait_type": "BPM", "value": ', Strings.toString(metadata.bpm), '},',
                '{"trait_type": "Bars", "value": ', Strings.toString(metadata.bars), '},',
                '{"trait_type": "Creator FID", "value": ', Strings.toString(metadata.creatorFid), '}',
            '],',
            '"animation_url": "', this.getShareableURL(tokenId), '",',
            '"external_url": "', this.getShareableURL(tokenId), '"}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(json))
        ));
    }

    /**
     * @dev Update mint price (owner only)
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    /**
     * @dev Withdraw contract funds (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return songs[tokenId].metadata.created != 0;
    }

    /**
     * @dev Simple base64 encoding for JSON metadata
     */
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLength = ((data.length + 2) / 3) * 4;
        string memory result = new string(encodedLength);
        
        assembly {
            let tablePtr := add(table, 1)
            let dataPtr := add(data, 0x20)
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 0x20)
            
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := shl(248, mload(dataPtr))
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(250, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(244, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(238, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(232, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 { mstore8(sub(resultPtr, 2), 0x3d) mstore8(sub(resultPtr, 1), 0x3d) }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }
        
        return result;
    }
}