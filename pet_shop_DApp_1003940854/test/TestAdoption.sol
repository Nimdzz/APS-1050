pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Adoption.sol";

contract TestAdoption {
    // The address of the adoption contract to be tested
    Adoption adoption = Adoption(DeployedAddresses.Adoption());

    // The id of the pet that will be used for testing
    uint expectedPetId = 8;

    //The expected owner of adopted pet is this contract
    address expectedAdopter = address(this);

    // The return fee in wei
    uint returnFee = 10000000000000000; // Adjust as per your contract logic
    // Deploy a new contract before each test
    function beforeEach() public {
        adoption = new Adoption();
    }

    // Testing the adopt() function
    function testUserCanAdoptPet() public {
        uint returnedId = adoption.adopt(expectedPetId);

        Assert.equal(
            returnedId,
            expectedPetId,
            "Adoption of the expected pet should match what is returned."
        );
    }

 // Testing the returnPet() function with a fee
function testUserCanReturnPet() public {
    // First, adopt the pet to ensure it is owned by this contract
    adoption.adopt(expectedPetId);

    // Then, return the pet, ensuring the correct fee is sent
    (bool success, ) = address(adoption).call.value(returnFee)(
        abi.encodeWithSignature("returnPet(uint256)", expectedPetId)
    );

    // Assert that the transaction was successful
    Assert.isTrue(success, "Pet should be returned successfully");

    // Verify the pet is returned by checking that the adopter is reset
    address adopter = adoption.adopters(expectedPetId);

    Assert.equal(
        adopter,
        address(0),
        "Pet should be returned and no longer have an owner."
    );
}


    // Testing retrieval of a single pet's owner
    function testGetAdopterAddressByPetId() public {
        adoption.adopt(expectedPetId); // Adopt the pet first

        address adopter = adoption.adopters(expectedPetId);

        Assert.equal(
            adopter,
            expectedAdopter,
            "Owner of the expected pet should be this contract"
        );
    }

    // Testing retrieval of all pet owners
    function testGetAdopterAddressByPetIdInArray() public {
        // Store adopters in memory rather than contract's storage
        address[16] memory adopters = adoption.getAdopters();

        Assert.equal(
            adopters[expectedPetId],
            expectedAdopter,
            "Owner of the expected pet should be this contract"
        );
    }
     // Test the like function
    function testUserCanLikePet() public {
        uint petId = 8; // example pet ID
        adoption.like(petId);

        uint expected = 1;
        Assert.equal(adoption.getLikes(petId), expected, "Like count should be 1 after liking.");
    }

    // Test the updateStats function
    function testUpdateStats() public {

        uint initialAdoptions = adoption.getTotalAdoptions();
        uint initialCustomerCount = adoption.getCustomerCount();

        adoption.adopt(1);
        adoption.adopt(2);

        uint newAdoptions = adoption.getTotalAdoptions();
        uint newCustomerCount = adoption.getCustomerCount();

        Assert.equal(newAdoptions, initialAdoptions + 2, "Total adoptions should increment by 2.");
        Assert.equal(newCustomerCount, initialCustomerCount + 1, "Customer count should increment by 1.");
    }
    // Test the getMostAdoptedBreed function
    function testGetMostAdoptedBreed() public {
        // Set the breeds for pets 
        adoption.setBreed(0, "BreedA");
        adoption.setBreed(1, "BreedB");
        adoption.setBreed(2, "BreedA");

        adoption.adopt(0);
        adoption.adopt(2);

        // Get the most adopted breed
        string memory mostAdoptedBreed = adoption.getMostAdoptedBreed();
        string memory expectedBreed = "BreedA";

        Assert.equal(mostAdoptedBreed, expectedBreed, "Most adopted breed should be BreedA.");
    }
}
