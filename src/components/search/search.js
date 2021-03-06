import React, {Component} from 'react'
import {Route} from 'react-router-dom'
import {connect} from 'react-redux'

import LazyLoadComponent from 'common/js/lazyLoad'

import SearchBox from 'base/searchBox/searchBox'
import Scroll from 'base/scroll/scroll'
import Suggest from 'components/suggest/suggest'
import SearchList from 'base/searchList/searchList'
import Confirm from 'base/confirm/confirm'

import {getHotKey} from 'api/search.js'
import Singers from 'common/js/singer'
import {set_singer} from 'store/action-creator'
import {insertSong, clearSearchHistory} from 'store/action'

import {searchHoc} from 'common/js/mixin'

import {ERR_OK} from 'api/config'
import './search.styl'

const SingerDetail = LazyLoadComponent({loader: () => import('base/singerDetail/singerDetail')})
const TYPE_SINGER = 'singer'

class Search extends Component{
  constructor(props) {
    super(props)
    this.state = {
      hotKey: [],
      refreshDelay: 120
    }
    this.selectItem = this.selectItem.bind(this)
    this.showConfirm = this.showConfirm.bind(this)
  }

  componentDidMount() {
    getHotKey().then((res) => {
      if (res.code === ERR_OK) {
        this.setState({
          hotKey: res.data.hotkey.slice(0, 10)
        })
      }
    })
  }

  shouldComponentUpdate(nextProps) {
    const bottom = nextProps.player.playList.length > 0 ? '60px' : 0
    this.refs.searchResult.style.bottom = bottom
    // console.log(this.refs.suggest)
    this.refs.suggest.refresh()

    this.refs.shortcutWrapper.style.bottom = bottom
    this.refs.shortcut.refresh()
    return true
  }

  selectItem(v) {
    if (v.type === TYPE_SINGER) {
      const singer = new Singers({
        id: v.singermid,
        name: v.singername
      })
      const {match} = this.props
      const url = `${match.url}/${singer.id}`
      this.props.history.push(url)
      this.props.set_singer(singer)
    } else {
      this.props.insertSong(v)
    }
    this.props.saveSearch()
  }

  showConfirm() {
    this.refs.confirm.show()
  }

  render() {
    const {match} = this.props
    const {searchHistory, query} = this.props
    let shortcut = this.state.hotKey.concat(searchHistory)
    return(
      <div className="search-wrapper">
        <div className="search-box-wrapper">
          <SearchBox ref={this.props.searchRef} onInput={this.props.onQueryChange}/>
        </div>
        {
          <div className="shortcut-wrapper" ref="shortcutWrapper" style={{"display": !query ? '' : 'none'}}>
            <Scroll
              ref="shortcut"
              className="shortcut"
              probeType={3}
              data={shortcut}
              refreshDelay={this.state.refreshDelay}
            >
              <div>
                <div className="hot-key">
                  <h1 className="title">热门搜索</h1>
                  <ul>
                    {
                      this.state.hotKey.map(v =>
                        <li className="item" key={v.k} onClick={() => this.props.addQuery(v.k)}>
                          <span>{v.k}</span>
                        </li>
                      )
                    }
                  </ul>
                </div>
                {
                  searchHistory.length > 0 ?
                  <div className="search-history">
                    <h1 className="title">
                      <span className="text">搜索历史</span>
                      <span className="clear" onClick={this.showConfirm}>
                        <i className="icon-clear"></i>
                      </span>
                    </h1>
                    <SearchList
                      deleteOne={this.props.deleteSearchHistory}
                      selectItem={this.props.addQuery}
                      searches={searchHistory}
                    ></SearchList>
                  </div>
                  : null
                }
              </div>
            </Scroll>
          </div>
        }
        {
          <div className="search-result" ref="searchResult" style={{'display': query ? '' : 'none'}}>
            <Suggest
              selectItem={this.selectItem}
              query={this.props.query}
              onBeforeScroll={this.props.blurInput}
              ref="suggest">

            </Suggest>
          </div>
        }
        <Confirm
          ref="confirm"
          text="是否清空所有搜索历史"
          confirmBtnText="清空"
          confirm={this.props.clearSearchHistory}
        ></Confirm>
        <Route path={`${match.url}/:id`} component={SingerDetail}></Route>
      </div>
    )
  }
}
export default searchHoc(connect(null,
  {
    set_singer,
    insertSong,
    clearSearchHistory
  })(Search))
