export default class NotificationsPanel extends React.Component {

    constructor(props) {
        super(props)

        let providerProperties = {
            get_action:"get_my_feed",
            connexion_discrete:true,
            format:"xml",
            feed_type:"alert",
            merge_description:"false"
        };
        let repositoryScope = 'all';
        if(!(pydio && pydio.user && pydio.user.activeRepository === 'ajxp_home')){
            providerProperties['current_repository'] = 'true';
            repositoryScope = pydio.user.activeRepository;
        }
        const dataModel = PydioDataModel.RemoteDataModelFactory(providerProperties, 'Notifications');
        const rNode = dataModel.getRootNode();
        rNode.observe("loaded", function(){
            const unread = parseInt(rNode.getMetadata().get('unread_notifications_count')) || 0;
            if(unread) {
                this.setState({unreadStatus: unread});
            }
        }.bind(this));
        rNode.load();

        if(repositoryScope === 'all'){
            this._pe = new PeriodicalExecuter(() => {rNode.reload(null, true)}, 8);
        }else{
            this._smObs = function(event){
                if(XMLUtils.XPathSelectSingleNode(event, 'tree/reload_user_feed')) {
                    rNode.reload(null, true);
                }
            }.bind(this);
        }
        this.props.pydio.observe("server_message", this._smObs);

        this.state = {
            open: false,
            dataModel:dataModel,
            repositoryScope: repositoryScope,
            unreadStatus: 0
        };
    }

    componentWillUnmount() {
        if(this._smObs){
            this.props.pydio.stopObserving("server_message", this._smObs);
        }else if(this._pe){
            this._pe.stop();
        }
    }

    handleTouchTap(event) {
        // This prevents ghost click.
        event.preventDefault();
        if(this.state.unreadStatus){
            this.updateAlertsLastRead();
        }
        this.setState({
            open: true,
            anchorEl: event.currentTarget,
            unreadStatus: 0
        });
    }

    handleRequestClose() {
        this.setState({
            open: false,
        });
    }

    renderIcon(node) {
        return (
            <PydioWorkspaces.FilePreview
                loadThumbnail={true}
                node={node}
                pydio={this.props.pydio}
                rounded={true}
            />
        );
    }

    renderSecondLine(node) {
        return node.getMetadata().get('event_description');
    }

    renderActions(node) {
        const touchTap = function(event){
            event.stopPropagation();
            this.dismissAlert(node);
        }.bind(this);
        return <MaterialUI.IconButton
            iconClassName="mdi mdi-close"
            onClick={touchTap}
            style={{width: 36, height: 36, padding: 6}}
            iconStyle={{color: 'rgba(0,0,0,.23)', hoverColor:'rgba(0,0,0,.73)'}}
        />;
    }

    entryClicked(node) {
        this.handleRequestClose();
        this.props.pydio.goTo(node);
    }

    dismissAlert(node) {
        const alertId = node.getMetadata().get('alert_id');
        const occurences = node.getMetadata().get('event_occurence');
        PydioApi.getClient().request({
            get_action:'dismiss_user_alert',
            alert_id:alertId,
            // Warning, occurrences parameter expects 2 'r'
            occurrences:occurences
        }, function(t){
            this.refs.list.reload();
        }.bind(this));
    }

    updateAlertsLastRead() {
        PydioApi.getClient().request({
            get_action          : 'update_alerts_last_read',
            repository_scope    : this.state.repositoryScope
        });
    }

    render() {

        let button;
        const buttonIcon = (
            <MaterialUI.IconButton
                onTouchTap={this.handleTouchTap}
                iconClassName={this.props.iconClassName || "icon-bell"}
                tooltip={this.props.pydio.MessageHash['notification_center.4']}
                className="userActionButton"
            />
        );

        return (
            <span>
                <MaterialUI.Badge
                    badgeContent={this.state.unreadStatus}
                    secondary={true}
                    style={this.state.unreadStatus  ? {padding: '0 24px 0 0'} : {padding: 0}}
                    badgeStyle={!this.state.unreadStatus ? {display:'none'} : null}
                >{buttonIcon}</MaterialUI.Badge>
                <MaterialUI.Popover
                    open={this.state.open}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    onRequestClose={this.handleRequestClose}
                    style={{width:320}}
                    zDepth={2}

                >
                    <PydioComponents.NodeListCustomProvider
                        ref="list"
                        className={'files-list'}
                        hideToolbar={true}
                        pydio={this.props.pydio}
                        elementHeight={PydioComponents.SimpleList.HEIGHT_TWO_LINES + 2}
                        heightAutoWithMax={500}
                        presetDataModel={this.state.dataModel}
                        reloadAtCursor={true}
                        actionBarGroups={[]}
                        entryRenderIcon={this.renderIcon}
                        entryRenderSecondLine={this.renderSecondLine}
                        entryRenderActions={this.renderActions}
                        nodeClicked={this.entryClicked}
                        emptyStateProps={{
                            style:{paddingTop: 20, paddingBottom: 20},
                            iconClassName:'mdi mdi-bell-off',
                            primaryTextId:'notification_center.14',
                            secondaryTextId:'notification_center.15',
                        }}
                    />
                </MaterialUI.Popover>
            </span>
        );
    }

}