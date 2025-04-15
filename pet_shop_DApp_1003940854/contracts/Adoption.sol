pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;
    uint[16] public likes; // Track likes for each pet
    mapping(uint => mapping(address => bool)) public hasLiked;
    mapping(string => uint) public breedAdoptions; // Track adoptions per breed
    mapping(uint => string) public petBreeds; // Map pet IDs to breeds
    uint public totalAdoptions;
    uint public customerCount;
    mapping(address => bool) public customers;
    mapping(address => uint) public adoptionsCount;

    constructor() public {
        // Initialize breeds for each petId (example data)
        petBreeds[0] = "Scottish Terrier";
        petBreeds[1] = "Scottish Terrier";
        petBreeds[2] = "French Bulldog";
        petBreeds[3] = "Boxer";
        petBreeds[4] = "French Bulldog";
        petBreeds[5] = "French Bulldog";
        petBreeds[6] = "Golden Retriever";
        petBreeds[7] = "Golden Retriever";
        petBreeds[8] = "French Bulldog";
        petBreeds[9] = "Boxer";
        petBreeds[10] = "Boxer";
        petBreeds[11] = "Scottish Terrier";
        petBreeds[12] = "French Bulldog";
        petBreeds[13] = "Golden Retriever";
        petBreeds[14] = "Golden Retriever";
        petBreeds[15] = "Golden Retriever";
    }

    // Adopting a pet
    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15, "Invalid pet ID");
        // Increment only on first adption. Avoid duplication
        if (adoptionsCount[msg.sender] == 0) {
            customerCount++;
        }

        adoptionsCount[msg.sender]++;

        // Mark the pet as adopted by the sender
        adopters[petId] = msg.sender;

        // Increment the breed adoption count
        if (breedAdoptions[petBreeds[petId]] > 0) {
            breedAdoptions[petBreeds[petId]] += 1;
        } else {
            breedAdoptions[petBreeds[petId]] = 1;
        }

        // Increment the total number of adoptions
        totalAdoptions += 1;

        // Mark the sender as a customer
        customers[msg.sender] = true;

        return petId;
    }

    // Liking a pet
    function like(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);
        require(
            !hasLiked[petId][msg.sender],
            "You have already liked this pet"
        );

        likes[petId] += 1;
        hasLiked[petId][msg.sender] = true;
        return likes[petId];
    }
    // Get the number of likes for a pet
    function getLikes(uint petId) public view returns (uint) {
        require(petId >= 0 && petId <= 15);
        return likes[petId];
    }

    function returnPet(uint petId) public payable {
        require(petId >= 0 && petId <= 15);
        require(adopters[petId] == msg.sender);
        require(msg.value >= 0.01 ether); // Example return fee
        
        adopters[petId] = address(0);
        breedAdoptions[petBreeds[petId]] -= 1;
        totalAdoptions -= 1;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    // Retrieving the likes
    function getLikes() public view returns (uint[16] memory) {
        return likes;
    }

    // Function to get the most adopted breed
    function getMostAdoptedBreed() public view returns (string memory) {
        string memory mostAdoptedBreed = "";
        uint highestCount = 0;

        for (uint i = 0; i < 16; i++) {
            string memory breed = petBreeds[i];
            uint count = breedAdoptions[breed];
            if (count > highestCount) {
                highestCount = count;
                mostAdoptedBreed = breed;
            }
        }
        return mostAdoptedBreed;
    }
    // For test only
    function setBreed(uint petId, string memory breed) public {
        require(petId >= 0 && petId <= 15);
        petBreeds[petId] = breed;
    }

    function getTotalAdoptions() public view returns (uint) {
        return totalAdoptions;
    }

    function getCustomerCount() public view returns (uint) {
        // uint count = 0;
        // for (uint i = 0; i < 16; i++) {
        //     if (adopters[i] != address(0)) {
        //         count += 1;
        //     }
        // }
        // return count;
        return customerCount;
    }

    function getPetsByOwner(
        address owner
    ) public view returns (uint[] memory) {
        uint ownedPetCount = 0;

        // First, count how many pets the owner has
        for (uint i = 0; i < 16; i++) {
            if (adopters[i] == owner) {
                ownedPetCount++;
            }
        }

        // Initialize the array with the correct size
        uint[] memory result = new uint[](ownedPetCount);
        uint counter = 0;

        // Populate the array with the names of the owned pets
        for (uint i = 0; i < 16; i++) {
            if (adopters[i] == owner) {
                result[counter] = i;
                counter++;
            }
        }

        return result;
    }

    function getPetLikes(uint petId) public view returns (uint) {
        require(petId >= 0 && petId <= 15, "Invalid pet ID");
        return likes[petId];
    }

    function hasUserLiked(uint petId, address user) public view returns (bool) {
        require(petId >= 0 && petId <= 15, "Invalid pet ID");
        return hasLiked[petId][user];
    }
}
