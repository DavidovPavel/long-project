using System;
using System.Collections.Generic;
using System.Linq;
using Anbr.Web.SA.CoreLogic.Model;
using Anbr.Web.SA.CoreLogic.Model.Wall;
using www.Areas.wall.Models;
using www.Areas.wall.Models.WidgetTypes;

namespace www.Helpers
{
    public class HelperDashboard
    {
        public static List<Widget> WidgetDtoToModelWithMix(List<WidgetDTO> widgets, Dictionary<Guid, List<Tuple<Guid, IEnumerable<QueryParamMapDTO>>>> subscribersData)
        {
            return widgets.ConvertAll(item =>
            {
                var w = item.ToLocalType();

                w.publishers = new Guid[0];

                if (subscribersData.TryGetValue(item.WidgetUID, out var publishers))
                {
                    w.publishers = publishers.Select(p => p.Item1).ToArray();
                    w.publishersSubscriberMap = publishers.ToDictionary(key => key.Item1,
                        el => el.Item2.ToLocalType().ToList());
                }

                return w;
            });
        }
    }
}