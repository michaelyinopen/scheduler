# Scheduler

A drag and drop scheduler for the job shop scheduling problem.

<img src="./documentation/preview.jpg"/>

## Live web app
<a href="https://scheduler.michael-yin.net" target="_blank">https://scheduler.michael-yin.net</a>

## Install
```
npm install --workspace=common
npm install
cd server
npm install
```

## Server Setup

### Server environment variables

Create a `.env` at `/server`, for dev environment.
Or setup environment variables in production.

```
NODE_ENV=Development
DATABASE_PATH=database/scheduler.db
PORT=8080
SESSION_SECRET=keyboard cat
```

### Server production folder
Need to create the database folder (locally and in production) manually.

## Start server
```
cd server
npm run start
```

## Start client
```
npm run dev
```

## Reset mechanism

<details>
<summary>
The data hard resets every week.
</summary>

The vector clock's serverId entry (replicaId = 1) value has a sepcial meaning.
When the value increments, the CRDT data is reset to the example data, and removes all other replicaIds from the vector clock.
Events and messages with a lower "vector clock's serverId entry (replicaId = 1)" will not have any effect on the CRDT data.

vector clock number of with replicaId = 1 has special meaning
  

server
  - a method to increment the hard reset clock
    - create a new vector clock that only has the server's replicaId entry
    - re-create replicationState from example
      - updates sequence
    - empty observe
    - save to database and cache
    - send reset
  - handle initialize: unchanged
  - handle connect, if server vector clock increased
    - send reset
  - handle submit: events with lower server clock
    - saves to events
    - update replicated state's
	  - not apply event
	  - not update observed
	  - updates sequence
	  - not update version

client
  - handle reset
    - only reapply events after checking server's replicaId
  - handle replicate
    - only respond events after checking server's replicaId
  - handle replicated
</details>

## Credits

Where I found the example problems

- Example 2: https://developers.google.com/optimization/scheduling/job_shop
- Example 3: https://d-nb.info/1242174915/34
