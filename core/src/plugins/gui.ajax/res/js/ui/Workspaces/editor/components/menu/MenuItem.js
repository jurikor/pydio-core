import Pydio from 'pydio';
import { connect } from 'react-redux';
import { FloatingActionButton } from 'material-ui';

const { EditorActions } = Pydio.requireLib('hoc');

class MenuItem extends React.PureComponent {

    constructor(props) {
        super(props)

        const {editorSetActiveTab, editorModify} = props

        this.onClick = () => {
            editorModify({isPanelActive: true})
            editorSetActiveTab(this.props.id)
        }
    }

    render() {
        const {style, tab} = this.props

        if (!tab) return null

        const textStyle = {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 100,
            maxWidth: 100,
            textAlign: "center",
            left: -120,
            lineHeight: "30px",
            margin: "5px 0",
            padding: "0 5px",
            borderRadius: 4,
            background: "#000000",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            color: "#ffffff",
            opacity: "0.7"
        }

        return (
            <div style={style} onClick={this.onClick}>
                <span style={textStyle}>{tab.title}</span>
                <FloatingActionButton mini={true} ref="container" backgroundColor="#FFFFFF" zDepth={2} iconStyle={{backgroundColor: "#FFFFFF"}}>
                    <tab.icon {...this.props.tab} style={{fill: "#000000", flex: 1, alignItems: "center", justifyContent: "center", fontSize: 28, color: "#607d8b"}} loadThumbnail={true} />
                </FloatingActionButton>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    const { tabs } = state

    let current = tabs.filter(tab => tab.id === ownProps.id)[0]

    return  {
        ...ownProps,
        tab: current
    }
}

const ConnectedMenuItem = connect(mapStateToProps, EditorActions)(MenuItem)

export default ConnectedMenuItem
