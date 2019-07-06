/**
 * Unit test of TermsForResourceService - create terms for resource.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const service = require('../../src/services/TermsForResourceService')
const models = require('../../src/models')
const { user, request } = require('../common/testData')
const { assertError, assertInfoMessage, clearLogs } = require('../common/testHelper')

const TermsForResource = models.TermsForResource

module.exports = describe('create terms for resource', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('create terms for resource success', async () => {
    let data = _.cloneDeep(request.createTermsForResource.reqBody)
    const entity = await service.createTermsForResource(user.user1, data)
    const record = await TermsForResource.findOne({ where: { id: entity.id }, raw: true })
    should.equal(record.reference, 'challenge')
    should.equal(record.referenceId, '12346')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds[0], 21307)
    should.equal(record.createdBy, 'TonyJ')
    should.exist(record.created)
    assertInfoMessage(`Publish event to Kafka topic ${config.TERMS_CREATE_TOPIC}`)
  })

  it('create terms for resource success 2', async () => {
    let data = _.cloneDeep(request.createTermsForResource.reqBody)
    data.tag = 'manager'
    const entity = await service.createTermsForResource(user.m2mWrite, data)
    const record = await TermsForResource.findOne({ where: { id: entity.id }, raw: true })
    should.equal(record.reference, 'challenge')
    should.equal(record.referenceId, '12346')
    should.equal(record.tag, 'manager')
    should.equal(record.termsOfUseIds[0], 21307)
    should.equal(record.createdBy, user.m2mWrite.sub)
    should.exist(record.created)
    assertInfoMessage(`Publish event to Kafka topic ${config.TERMS_CREATE_TOPIC}`)
  })

  it('failure - create terms for resource again, duplicate', async () => {
    let data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await service.createTermsForResource(user.user1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, `Duplicate terms reference for tuple { reference: 'challenge', referenceId: '12346', tag: 'copilot' }`)
    }
  })

  it('failure - create terms for resource again, invalid terms id', async () => {
    let data = _.cloneDeep(request.createTermsForResource.reqBody)
    data.referenceId = '10000'
    data.termsOfUseIds.push(10000)
    data.termsOfUseIds.push(10001)
    try {
      await service.createTermsForResource(user.user1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, `The following terms doesn't exist: [ 10000, 10001 ]`)
    }
  })
})
