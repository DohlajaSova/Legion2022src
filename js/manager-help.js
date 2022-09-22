Ext.onReady(function(){
    let cmp = Ext.getCmp('modx-panel-resource');
    if (myHelpConfig != undefined){
        cmp.insert(1, {
            layout: 'form',
            header: false,
            autoHeight: true,
            collapsible: true,
            items: [{
                id: 'manager-help-panel',
                html: myHelpConfig.text,
                xtype: 'modx-description',
                cls: 'main-wrapper'
            }]
        });
    }
    
    cmp.doLayout();
})