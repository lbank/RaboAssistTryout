const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const axios = require('axios')
var dateFormat = require('dateformat')

app.post('/', express.json(), (req, res) => {
  
  const agent = new WebhookClient({ request: req, response: res })
  let intentMap = new Map()

  function defaultWelcomeIntent(agent) {
    agent.add(`Welcome to your personal Rabo assistant!`);
    agent.add(`How can I help?`)
  }

  function defaultFallbackIntent(agent) {
    agent.add(`I'm sorry, I didn't quite get that. Can you rephrase your question?`);
  }

  function categorySpendingIntent(agent) {

    const spendingCategory = agent.parameters['spending-categories']
    const spendingPeriod = agent.parameters['date-period']

    let missingSlots = []

    if(!spendingCategory) { missingSlots.push('category') }
    if(!spendingPeriod) { missingSlots.push('timespan') }

    if (missingSlots.length === 1) {
      agent.add(`Looks like you didn't provide a ${missingSlots[0]}`)
    } if (missingSlots.length === 2) {
      agent.add(`Ok, I need two more things, a ${missingSLots[0]} and ${missingSlots[1]}`)
    } else {

      // var endpoint =  `https://f64ccf56.ngrok.io/monthly_expenses/?date_period=${JSON.stringify(spendingPeriod)}&category=${spendingCategory}`
      var endpoint = `https://7d20c0d7.ngrok.io/monthly_expenses/`
      
      return new Promise(function(resolve, reject) {
          axios.get(endpoint, {
            params: {
              date_period: spendingPeriod,
              category: spendingCategory
            }
          })
          .then(function(response) {
              resolve(agent.add(`
                You have spent €${response.data.amount} on "${spendingCategory.toUpperCase()}" 
                from ${dateFormat(spendingPeriod.startDate, "mmmm dS")} 
                to ${dateFormat(spendingPeriod.endDate, "mmmm dS")}.`
              ))
          })
          .catch(function(error) {
            reject(error)
          })
      })

      agent.add(`
        You have spent x on ${spendingCategory} 
        from ${dateFormat(spendingPeriod.startDate, "mmmm dS")} 
        to ${dateFormat(spendingPeriod.endDate, "mmmm dS")}.`)
    }

  }
  
  intentMap.set('Default Welcome Intent', defaultWelcomeIntent)
  intentMap.set('Default Fallback Intent', defaultFallbackIntent)
  intentMap.set('category.spending', categorySpendingIntent)

  agent.handleRequest(intentMap)

})
 
app.listen(process.env.PORT || 8080)
