import React from 'react'
import ReactDOM from 'react-dom'

import Bootstrap, {
  Col,
  Grid,
  Panel,
  Row,
  Tooltip as BTooltip,
  OverlayTrigger,
  DropdownButton,
  MenuItem,
  ButtonGroup
} from 'react-bootstrap'

import Select from 'react-select'

import { Area, AreaChart, Legend, Tooltip, PieChart, Pie, ResponsiveContainer } from 'recharts'

import style from './style.scss'
import _ from 'lodash'
import classnames from 'classnames'
import moment from 'moment'

import 'react-select/dist/react-select.css'

const color = {
  facebook: '#8884d8',
  slack: '#de5454',
  kik: '#ffc658',
  male: '#8884d8',
  female: '#de5454',
  conversation: '#de5454'
}

const ranges = {
  lastweek: () => ({
    from: moment()
      .startOf('week')
      .subtract(7, 'days'),
    to: moment()
      .endOf('week')
      .subtract(7, 'days'),
    label: 'Last week'
  }),

  lastmonth: () => ({
    from: moment()
      .startOf('month')
      .subtract(1, 'month'),
    to: moment()
      .endOf('month')
      .subtract(1, 'month'),
    label: 'Last month'
  }),

  last7days: () => ({
    from: moment().subtract(7, 'days'),
    to: moment(),
    label: 'Last 7 days'
  }),

  thismonth: () => ({
    from: moment().startOf('month'),
    to: moment(),
    label: 'This month'
  }),

  thisweek: () => ({
    from: moment().startOf('week'),
    to: moment(),
    label: 'This week'
  }),

  yesterday: () => ({
    from: moment().subtract(1, 'day'),
    to: moment().subtract(1, 'day'),
    label: 'Yesterday'
  }),

  today: () => ({
    from: moment(),
    to: moment(),
    label: 'Today'
  })
}

export default class CustomMetrics extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      metrics: [],
      range: 'thisweek'
    }

    this.render_count = this.render_count.bind(this)
    this.render_percent = this.render_percent.bind(this)
    this.render_piechart = this.render_piechart.bind(this)
  }

  componentDidMount() {
    this.fetchMetrics()
  }

  fetchMetrics() {
    const range = this.getCurrentRange()

    return this.props.axios
      .get('/api/botpress-analytics/custom_metrics', {
        params: {
          from: range.from,
          to: range.to
        }
      })
      .then(({ data }) => {
        this.setState({ metrics: data })
      })
  }

  getCurrentRange() {
    const range = ranges[this.state.range]()
    return {
      from: range.from.format('YYYY-MM-DD'),
      to: range.to.format('YYYY-MM-DD')
    }
  }

  mergeDataWithDates(data) {
    const range = ranges[this.state.range]()
    const i = moment(range.from)

    while (i.isSameOrBefore(range.to, 'day')) {
      const name = i.format('YYYY-MM-DD')

      if (!_.find(data, { name: name })) {
        data.push({
          name: name,
          value: 0
        })
      }

      i.add(1, 'day')
    }

    return _.sortBy(data, ['name'])
  }

  render_count(metric) {
    const data = this.mergeDataWithDates(
      metric.results.map(row => {
        return { name: row.date, value: row.count }
      })
    )

    if (data.length === 1) {
      data.push(data[0])
    }

    const sum = _.sumBy(metric.results, 'count')
    let avgPerDay = (sum / metric.results.length).toFixed(2)
    let absAvg = (sum / data.length).toFixed(2)

    avgPerDay = isNaN(avgPerDay) ? 0 : avgPerDay
    absAvg = isNaN(absAvg) ? 0 : absAvg

    return (
      <div>
        <div className={style.customCount} style={{ height: '50px' }}>
          {sum}
        </div>
        <div className={style.customCountSmall} style={{ height: '25px' }}>
          Avg {avgPerDay} ({absAvg})
        </div>
        <ResponsiveContainer width="100%" height={75}>
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  render_percent(metric) {
    const data = this.mergeDataWithDates(
      metric.results.map(row => {
        return { name: row.date, value: row.percent }
      })
    )

    if (data.length === 1) {
      data.push(data[0])
    }

    const sum = _.sumBy(metric.results, 'percent')
    let avgPerDay = (sum / metric.results.length * 100).toFixed(1)
    let absAvg = (sum / data.length * 100).toFixed(1)

    avgPerDay = isNaN(avgPerDay) ? 0 : avgPerDay
    absAvg = isNaN(absAvg) ? 0 : absAvg

    return (
      <div>
        <div className={style.customCount} style={{ height: '50px' }}>
          {avgPerDay}%
        </div>
        <div className={style.customCountSmall} style={{ height: '25px' }}>
          Abs Average: {absAvg}%
        </div>
        <ResponsiveContainer width="100%" height={75}>
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  render_piechart(metric) {
    const data = metric.results.map(row => {
      return { name: row.name, value: row.count }
    })

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cy={70} innerRadius={0} outerRadius={70} fill="#82ca9d" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )

    return null
  }

  renderCustomMetric(metric) {
    const renderer = this['render_' + metric.type]

    const descriptionTooltip = <BTooltip id={`metric-${metric.name}-tooltip`}>{metric.description}</BTooltip>

    const tooltip = (
      <span className={classnames(style.metricInfo, 'bp-info')}>
        <OverlayTrigger placement="top" overlay={descriptionTooltip}>
          <i className="material-icons">info</i>
        </OverlayTrigger>
      </span>
    )

    const header = (
      <div>
        <span className={style.metricName}>{metric.name}</span>
        {tooltip}
      </div>
    )
    return (
      <Panel header={header}>
        <div className={style.smallGraphContainer}>{renderer && renderer(metric)}</div>
      </Panel>
    )
  }

  render() {
    const chunks = _.chunk(this.state.metrics || [], 4)

    if (!chunks.length) {
      return null
    }

    const renderChunk = chunk => {
      return chunk.map(metric => {
        return (
          <Col sm={6} md={3} key={`col-metric-${metric.name}`}>
            {this.renderCustomMetric(metric)}
          </Col>
        )
      })
    }

    const chunkElements = chunks.map((chunk, i) => <Row key={`chunk-${i}`}>{renderChunk(chunk)}</Row>)

    const currentSelection = ranges[this.state.range]().label

    const options = _.keys(ranges).map(key => {
      const cc = () => {
        this.setState({ range: key })
        setTimeout(() => {
          this.fetchMetrics()
        }, 100)
      }
      return (
        <MenuItem key={key} eventKey={key} onSelect={cc}>
          {ranges[key]().label}
        </MenuItem>
      )
    })

    const dropdown = (
      <ButtonGroup>
        <DropdownButton title={currentSelection} className={style.rangeDropdown} id="selectRangeDropdown">
          {options}
        </DropdownButton>
      </ButtonGroup>
    )

    const options2 = _.keys(ranges).map(range => {
      return {
        label: ranges[range]().label,
        value: range
      }
    })

    const _onSelect = key => {
      this.setState({ range: key.value })
      setTimeout(() => {
        this.fetchMetrics()
      }, 100)
    }

    const dropdown2 = (
      <Select
        options={options2}
        onChange={_onSelect.bind(this)}
        value={this.state.range}
        clearable={false}
        autoBlur={true}
        className={style.rangeDropdown}
        placeholder="Select a date range"
      />
    )

    return (
      <div>
        <Row>
          <Col sm={12}>
            <span className={style.title}>Custom Analytics</span>
            {dropdown2}
            <hr />
          </Col>
        </Row>
        <Grid fluid>{chunkElements}</Grid>
      </div>
    )
  }
}