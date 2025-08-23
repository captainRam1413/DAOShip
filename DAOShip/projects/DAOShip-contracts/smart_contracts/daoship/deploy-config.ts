import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { YesNoRewardFactory } from '../artifacts/daoship/YesNoRewardClient'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying YesNoReward DAO Contract ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(YesNoRewardFactory, {
    defaultSender: deployer.addr,
  })

  // Deploy the contract
  const { appClient, result } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append'
  })

  // Fund the app account if it was just created
  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  }

  console.log(
    `Successfully deployed YesNoReward DAO Contract at ${appClient.appClient.appId}`,
  )
}
