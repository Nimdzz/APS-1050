App = {
    web3Provider: null,
    contracts: {},

    init: async function () {
        // Load pets.
        $.getJSON("../pets.json", function (data) {
            var petsRow = $("#petsRow");
            var petTemplate = $("#petTemplate");

            for (i = 0; i < data.length; i++) {
                petTemplate.find(".panel-title").text(data[i].name);
                petTemplate.find("img").attr("src", data[i].picture);
                petTemplate.find(".pet-breed").text(data[i].breed);
                petTemplate.find(".pet-age").text(data[i].age);
                petTemplate.find(".pet-location").text(data[i].location);
                petTemplate.find(".btn-adopt").attr("data-id", data[i].id);
                petTemplate.find(".btn-return").attr("data-id", data[i].id);
                petTemplate.find(".btn-like").attr("data-id", data[i].id);

                petsRow.append(petTemplate.html());
            }
        });

        await App.initWeb3();
    },

    initWeb3: async function () {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access");
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:7545"
            );
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Adoption.json", function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var AdoptionArtifact = data;
            App.contracts.Adoption = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.Adoption.setProvider(App.web3Provider);

            // Use our contract to retrieve and mark the adopted pets
            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                    return;
                }
                var account = accounts[0];

                // Use our contract to retrieve and mark the adopted pets
                App.markAdopted(account);
            });
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on("click", ".btn-adopt", App.handleAdopt);
        $(document).on("click", ".btn-like", App.handleLike);
        $(document).on("click", ".btn-return", App.handleReturn);
    },

    markAdopted: function (account) {
        var adoptionInstance;

        App.contracts.Adoption.deployed()
            .then(function (instance) {
                adoptionInstance = instance;

                return adoptionInstance.getAdopters.call();
            })
            .then(function (adopters) {
                for (i = 0; i < adopters.length; i++) {
                    if (
                        adopters[i] !==
                        "0x0000000000000000000000000000000000000000"
                    ) {
                        $(".panel-pet")
                            .eq(i)
                            .find(".btn-adopt")
                            .text("Adopted")
                            .attr("disabled", true);
                        // Enable or disable the "Return" button based on the adopter
                        if (adopters[i] === account) {
                            $(".panel-pet")
                                .eq(i)
                                .find(".btn-return")
                                .attr("disabled", false);
                        } else {
                            $(".panel-pet")
                                .eq(i)
                                .find(".btn-return")
                                .attr("disabled", true);
                        }
                    } else {
                        $(".panel-pet")
                            .eq(i)
                            .find(".btn-return")
                            .attr("disabled", true);
                    }
                }
            })
            .catch(function (err) {
                console.log(err.message);
            });
        
        App.getMostAdoptedBreed()
        App.updateStats();
        App.updateLikes();
        App.getPetsByOwner();
        App.markLikes(account);
    },

    handleAdopt: function (event) {
        event.preventDefault();

        var petId = parseInt($(event.target).data("id"));

        var adoptionInstance;

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            console.log("Pet ID:", petId);
            console.log("Account:", account);

            App.contracts.Adoption.deployed()
                .then(function (instance) {
                    adoptionInstance = instance;

                    // Execute adopt as a transaction by sending account
                    return adoptionInstance.adopt(petId, { from: account });
                })
                .then(function (result) {
                    return App.markAdopted(account);
                })
                .catch(function (err) {
                    console.log(err.message);
                });
        });
    },

    handleLike: function (event) {
        event.preventDefault();

        var petId = parseInt($(event.target).data("id"));
        var adoptionInstance;

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Adoption.deployed()
                .then(function (instance) {
                    adoptionInstance = instance;

                    return adoptionInstance.like(petId, { from: account });
                })
                .then(function (result) {
                    console.log("Liked pet", petId, "Likes:", result);
                    App.markLikes(account);
                    return App.updateLikes();
                })
                .catch(function (err) {
                    console.log(err.message);
                });

        });
    },

    updateLikes: function () {
        App.contracts.Adoption.deployed()
            .then(function (instance) {
                return instance.getLikes.call();
            })
            .then(function (likes) {
                console.log(likes);
                for (i = 0; i < likes.length; i++) {    
                    $(".panel-pet")
                        .eq(i)
                        .find(".pet-likes")
                        .text(likes[i].c[0]);
                }
            })
            .catch(function (err) {
                console.log(err.message);
            });
    },

    getMostAdoptedBreed: function () {
        var adoptionInstance;

        App.contracts.Adoption.deployed()
            .then(function (instance) {
                adoptionInstance = instance;

                return adoptionInstance.getMostAdoptedBreed.call();
            })
            .then(function (mostAdoptedBreed) {
                $("#mostAdoptedBreed").text(mostAdoptedBreed);
            })
            .catch(function (err) {
                console.log(err.message);
            });
    },

    updateStats: function () {
        var adoptionInstance;

        App.contracts.Adoption.deployed()
            .then(function (instance) {
                adoptionInstance = instance;

                return adoptionInstance.getTotalAdoptions.call();
            })
            .then(function (totalAdoptions) {
                $("#totalAdoptions").text(totalAdoptions.toNumber());
            })
            .catch(function (err) {
                console.log(err.message);
            });

        App.contracts.Adoption.deployed()
            .then(function (instance) {
                return instance.getCustomerCount.call();
            })
            .then(function (customerCount) {
                $("#customerCount").text(customerCount.toNumber());
            })
            .catch(function (err) {
                console.log(err.message);
            });
    },

    handleReturn: function (event) {
        event.preventDefault();

        var petId = parseInt($(event.target).data("id"));
        var adoptionInstance;

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Adoption.deployed()
                .then(function (instance) {
                    adoptionInstance = instance;

                    return adoptionInstance.returnPet(petId, {
                        from: account,
                        value: 10000000000000000n,
                    });
                })
                .then(function (result) {
                    console.log("Returned pet", petId);
                    $(".panel-pet")
                        .eq(petId)
                        .find(".btn-adopt")
                        .text("Adopt")
                        .attr("disabled", false);
                    $(".panel-pet")
                        .eq(petId)
                        .find(".btn-return")
                        .attr("disabled", true);
                    return App.updateStats();
                })
                .catch(function (err) {
                    console.log(err.message);
                });
        });
    },

    getPetsByOwner: function () {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.Adoption.deployed()
                .then(function (instance) {
                    return instance.getPetsByOwner.call(account);
                })
                .then(function (petNames) {
                    console.log("Pets owned by account:", petNames[0].c[0]);
    
                    // Clear the display area for owned pets
                    $("#ownedPets").empty();
    
                    $.getJSON("../pets.json", function (data) {
                        // Display each pet name
                        petNames.forEach(function (petName) {
                            $("#ownedPets").append(`<li>${data[petName.c[0]].name}</li>`);
                        });
                    })
                    
                })
                .catch(function (err) {
                    console.log(err.message);
                });
        });
    },

    markLikes: function (account) {
        var adoptionInstance;
  
        App.contracts.Adoption.deployed()
            .then(function (instance) {
                adoptionInstance = instance;
    
                // Loop through all pets
                for (let i = 0; i < 16; i++) {
                    // Check if the user has liked the pet
                    adoptionInstance.hasUserLiked
                        .call(i, account)
                        .then(function (liked) {
                        if (liked) {
                            // Disable the "Like" button if already liked
                            $(".panel-pet")
                                .eq(i)
                                .find(".btn-like")
                                .text("Liked")
                                .attr("disabled", true);
                        }
                    });
                }
            })
            .catch(function (err) {
                console.log(err.message);
            });
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
