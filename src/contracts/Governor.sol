// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {daoToken} from "./DAOToken.sol";

contract Governor {

    enum VoteType {
    Against,
    For,
    Abstain
    }

    enum ProposalState{
        pending,
        active,
        succeeded,
        defeated,
        executed
    }

    uint256 public quorumNumerator=10; // 10% of total supply
    uint256 public proposalCount;
    uint256 public votingPeriod=100; // Number of blocks for voting period
    uint256 public votingDelay=10; // Number of blocks before voting starts

    mapping(uint256=>Proposal_details) public proposals;
    mapping(uint256=>mapping(address=>bool)) public hasVoted;

    struct Proposal_details {
        address proposer;
        address recipient;
        uint256 amount;
        uint256 startBlock;
        uint256 endBlock;

        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;

    }
    function createProposal(
        address _recipient,
        uint256 _amount

    ) external{
        require(votingPeriod>0,"Voting Priod must be greater than zero");
        require(votingDelay>0,"Voting Delay must be greater than zero");
        require(_recipient!=address(0),"Recipient address cannot be zero");
        require(_amount>0,"Amount must be greater than zero");

        proposalCount++;

        uint256 startBlock=block.number+votingDelay;
        uint256 endBlock=startBlock+votingPeriod;
        require(startBlock<endBlock,"Start block must be before the end block");

        proposals [msg.sender]=Proposal_details({
            proposer:msg.sender,
            recipient:_recipient,
            amount:_amount,
            startBlock:startBlock,
            endBlock:endBlock,
            forVotes:0,
            againstVotes:0,
            abstainVotes:0
        });
    }

    function castVote(uint256 proposalId,uint8 support) external{
        Proposal_details storage proposal = proposals[proposalId];
        require(block.number>=proposal.startBlock,"Voting has not started yet");
        require(block.number<=proposal.endBlock,"Voting has ended");
        require(!hasVoted[proposalId][msg.sender],"Already Voted");

        uint256 votingPower=daoToken.getPastVotes(msg.sender,proposal.startBlock);
        require(
            votingPower > 0,
            "No voting power"
        );

        hasVoted[proposalId][msg.sender] = true;

        if (voteType == VoteType.For) {
            proposal.forVotes += votingPower;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

    }
    function state(uint256 proposalId)
        public
        view
        returns (ProposalState)
    {
        Proposal_details storage proposal = proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.number < proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        if(quorum(proposalId) && proposal.forVotes>proposal.againstVotes){
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    function quorum(uint256 proposalId) public view returns(bool){
        Proposal_details storage proposal =proposals[propoaalId];
        uint256 totalVotes=proposal.forVotes+proposal.againstVotes+proposal.abstainVotes;
        uint256 totalSupply=daoToken.totalSupply();
        uint256 quorumVotes=(totalSupply*quorumNumerator)/100;
        return totalVotes>=quorumVotes;
    }

    function executeProposal(uint256 proposalId) external {
        Proposal_details storage proposal = proposals[proposalId];
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        require(!proposal.executed, "Proposal already executed");
        proposal.executed = true;
        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "Transfer failed");
    }

}