using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using Anbr.Web.SA.CoreLogic.Model;
using Anbr.Web.SA.CoreLogic.Model.Wall;
using ANBR.Common.Filters;
using ANBR.Helpful.Misc.Graphic;
using ANBR.SemanticArchive.SDK;
using Model.Utils;
using Newtonsoft.Json.Linq;
using Omu.ValueInjecter;
using www.Areas.wall.Models.WidgetTypes;
using www.Common;
using www.Models;
using www.SaGateway;

namespace www.Areas.wall.Models
{
    internal static class TransformationHelper
    {
        /// <summary>
        /// Трансформация DTO модели запроса в клиентскую модель
        /// </summary>
        /// <param name="mDTO"></param>
        /// <param name="entryQuery"></param>
        /// <returns></returns>
        public static RequestParameters ToLocalType(this QueriesCandidateDTO mDTO, FTDLQuery entryQuery)
        {
            var requst = new RequestParameters
            {
                dbase = mDTO.Query.DatabaseID,
                domain = mDTO.Query.Host,
                pagesize = mDTO.Query.PageSize,
                requestid = mDTO.Query.SAQueryID,
                viewType = mDTO.Query.ViewType,
                useDefParams = mDTO.Query.UseDefParams ?? true,
                title = mDTO.Title,
                rid = mDTO.QueryID,
                ruleCode = mDTO.Query.ruleCode,
                parameters = mDTO.Query.Params.ConvertAll(qparam => qparam.ToLocalType(entryQuery)).ToList()
            };


            return requst;
        }

        public static RequestParameters ToLocalType(this QueryDTO mDTO, FTDLQuery entryQuery)
        {
            return new RequestParameters
            {
                dbase = mDTO.DatabaseID,
                domain = mDTO.Host,
                pagesize = mDTO.PageSize,
                requestid = mDTO.SAQueryID,
                viewType = mDTO.ViewType,
                useDefParams = mDTO.UseDefParams ?? true,
                rid = mDTO.QueryID,
                ruleCode = mDTO.ruleCode,
                parameters = mDTO.Params.ConvertAll(qparam => qparam.ToLocalType(entryQuery)).ToList()
            };
        }
        /*        
                public static QueryParameter ToLocalType(this QueryParamDTO mDTO)
                {
                    Tuple<string[], string> paramsData = StringParamToData(mDTO.QueryParamValues);
                    string title = paramsData.Item2;
                    string[] val = paramsData.Item1;
                    var p = new QueryParameter
                    {
                        id = mDTO.QueryParamID,
                        Name = mDTO.QueryParamName,
                        Caption = mDTO.QueryParamTitle,
                        DisplayValue = title,
                    };
                    p.SetValue(val);

                    return p;
                }
        */

        public static QueryParameter ToLocalType(this QueryParamDTO mDTO, FTDLQuery entryQuery)
        {
            Tuple<string[], string> paramsData = StringParamToData(mDTO.QueryParamValues);
            string title = paramsData.Item2;
            string[] val = paramsData.Item1;
            string paramName = mDTO.QueryParamName.StartsWith("#") ? mDTO.QueryParamName : $"#{mDTO.QueryParamName}#";
            FTDLParameter saParam = entryQuery?.Parametrs.FirstOrDefault(item => String.Equals(item.Name, paramName, StringComparison.OrdinalIgnoreCase));

            var p = new QueryParameter
            {
                id = mDTO.QueryParamID,
                Name = mDTO.QueryParamName,
                Caption = mDTO.QueryParamTitle,
                DisplayValue = title,
                IsInvalid = saParam == null,
            };
            if (saParam != null)
            {
                p.ParametrType = saParam.Type.ToString();
                p.MetaEntity = saParam.TypeID != default ? saParam.TypeID.ToString() : null;
                p.ParametrType = saParam.Type.ToString();
                p.Description = saParam.Description;
            }
            p.SetValue(val);

            if (saParam?.TypeID != default(int))
            {
                p.MetaEntity = saParam?.TypeID.ToString();
            }

            return p;
        }

        public static QueryParameter ToLocalType(this FTDLParameter mParameter)
        {
            var p = new QueryParameter
            {
                ParametrType = mParameter.Type.ToString(),
                Name = mParameter.Name,
                Caption = mParameter.Caption,
                Description = mParameter.Description,
                DisplayValue = mParameter.ValueText,
                IsMultiValues = mParameter.MultiValue,
                MetaEntity = mParameter.TypeID != default ? mParameter.TypeID.ToString() : null,
            };

            p.SetValue(new[] { mParameter.Value });

            return p;
        }


        public static IEnumerable<QueryParamMap> ToLocalType(this IEnumerable<QueryParamMapDTO> mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static QueryParamMap ToLocalType(this QueryParamMapDTO mDTO)
        {
            return (QueryParamMap)new QueryParamMap().InjectFrom(mDTO);
        }

        public static IEnumerable<VitrinUser> ToLocalType(this IEnumerable<VitrinUserDTO> mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static VitrinUser ToLocalType(this VitrinUserDTO mDTO)
        {
            return new VitrinUser
            {
                Access = mDTO.IsShare ? VitrinUser.AccessType.Readonly : VitrinUser.AccessType.ReadAndWrite,
                UserID = mDTO.UserID,
                UserTitle = mDTO.UserTitle,
                UserUID = mDTO.UserUID
            };
        }

        public static WidgetsParam[] ToLocalType(this WidgetsParamDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static WidgetsParam ToLocalType(this WidgetsParamDTO wpDTO)
        {
            return new WidgetsParam
            {
                WidgetParamUID = wpDTO.WidgetParamUID,
                WidgetParamName = wpDTO.WidgetParamName,
                WidgetParamValue = JToken.Parse(wpDTO.WidgetParamValue)
            };
        }

        public static VitrinaDecorationInfo ToLocalType(this VitrinaDecorationInfoDTO mDTO)
        {
            return (VitrinaDecorationInfo)new VitrinaDecorationInfo().InjectFrom(mDTO);
        }

        public static ColumnCustomizationInfo[] ToLocalType(this ColumnCustomizationDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static ColumnCustomizationInfo ToLocalType(this ColumnCustomizationDTO mDTO)
        {
            var m = (ColumnCustomizationInfo)new ColumnCustomizationInfo().InjectFrom(mDTO);
            m.QueryCustomizationUID = mDTO.QueryCustomizationUID;

            return m;
        }

        public static ReportItemInfo[] ToLocalType(this ReportItemInfoDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static ReportItemInfo ToLocalType(this ReportItemInfoDTO mDTO)
        {
            var m = (ReportItemInfo)new ReportItemInfo().InjectFrom(mDTO);
            m.UID = mDTO.UID;

            return m;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="mDTO"></param>
        /// <param name="ignoreTypeInfo"></param>
        /// <returns></returns>
        public static Widget ToLocalType(this WidgetDTO mDTO, bool ignoreTypeInfo = false)
        {
            var w = ignoreTypeInfo ? new Widget() : GetInstanceByDescriminator(mDTO.WidgetType);

            w.InjectFrom(mDTO).InjectFrom(new
            {
                height = mDTO.PlacementHeight,
                left = mDTO.PlacementLeft,
                top = mDTO.PlacementTop,
                title = mDTO.Title,
                width = mDTO.PlacementWidth,
                timeUpdate = mDTO.RefreshInterval,
                id = mDTO.WidgetUID,
                zIndex = mDTO.ZIndex,
                update = mDTO.AutoRefresh
            });

            if (mDTO.Decoration != null)
            {
                w.Decoration = new DecorationInfo();
                w.Decoration.InjectFrom(mDTO.Decoration);
            }

            if (mDTO.Legend != null)
            {
                w.Legend = new LegendInfo();
                w.Legend.InjectFrom<FastDeepCloneInjection>(mDTO.Legend);
            }

            if (mDTO.Characteristics != null)
                w.Characteristics = mDTO.Characteristics.ToLocalType();


            if (w is WidgetQuery wq)
            {
                var q = new RequestParameters {parameters = new List<QueryParameter>()}; //default empty value 

                if (mDTO.ColumnCustomization != null)
                    wq.ColumnCustomizations = mDTO.ColumnCustomization.ToLocalType();

                QueryDTO queryDTO = mDTO.Queries.FirstOrDefault();

                if (queryDTO != null)
                {
                    IDataBase saDB = null;
                    try
                    {
                        saDB = WebSaUtilities.ConnectorInstance.GetDataBase(queryDTO.DatabaseID, 0,
                            queryDTO.DatabaseName);
                    }
                    catch (SaDatabaseConnectionFaultException)
                    {
                    }

                    ANBR.Query.Common.QueryInfo qi = saDB?.QueryService.QueryGet(queryDTO.SAQueryID);

                    q = new RequestParameters
                    {
                        domain = queryDTO.Host,
                        rid = queryDTO.QueryID,
                        requestid = queryDTO.SAQueryID,
                        requestTitle = qi?.Name,
                        useDefParams = queryDTO.UseDefParams ?? true,
                        viewType = queryDTO.ViewType,
                        pagesize = queryDTO.PageSize,
                        ruleCode = queryDTO.ruleCode,
                        IsInvalid = saDB == null || (qi?.Query_ID ?? 0) == default,
                        dbase = queryDTO.DatabaseID,
                        dbTitle = saDB?.Name,
                        parameters = queryDTO.Params.ToLocalType(saDB, qi)
                    };
                }
                wq.requestParameters = q;
            }

            if (w is WidgetHtml wHtml)
            {
                wHtml.contentHtml = mDTO.ContentHtml;
            }

            if (w is WidgetSemNet wSemNet)
            {
                wSemNet.SNLayout = mDTO.SNLayout;
                wSemNet.SNLevel = mDTO.SNLevel;
                wSemNet.SNStruct = mDTO.SNStruct;
            }

            if (w is WidgetSource wSource)
            {
                wSource.isHtmlContent = mDTO.IsHtmlContent;
                wSource.contentProp = mDTO.ContentProp;
                wSource.hideTitle = mDTO.HideTitle;
                wSource.highlightMentionObj = mDTO.HighlightMentionObj;
                wSource.extractOnlyMedia = mDTO.ExtractOnlyMedia;
            }

            if (w is WidgetMap wMap)
            {
                wMap.CenterLat = mDTO.CenterLat;
                wMap.CenterLong = mDTO.CenterLong;
                wMap.Zoom = mDTO.Zoom;
                wMap.isClustered = mDTO.isClustered;
            }

            if (w is WidgetTable wTable)
            {
                wTable.isMarkSelectedItem = mDTO.isMarkSelectedItem;
            }

            return w;
        }

        public static List<QueryParameter> ToLocalType(this List<QueryParamDTO> mDTO, IDataBase saDB, ANBR.Query.Common.QueryInfo qi)
        {
            FTDLQuery entryQuery = null;
            if (qi != null && qi.Query_ID != default)
            {
                QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
                entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;
            }

            return mDTO.ToList()
                .ConvertAll(qparam => qparam.ToLocalType(entryQuery)).ToList();
        }

        public static Tuple<string[], string> StringParamToData(string paramStr)
        {
            var val2titles = paramStr.Split('¤');
            string[] value = val2titles[0].Split('§');
            var title = "";
            if (val2titles.Length > 1)
                title = val2titles[1];

            return new Tuple<string[], string>(value, title);
        }

        public static string ParamToString(QueryParameter dic)
        {
            string title = "";
            if (!String.IsNullOrWhiteSpace(dic.DisplayValue))
                title = "¤" + dic.DisplayValue;

            return dic.ValueCombine("§") + title;
        }


        private static Widget GetInstanceByDescriminator(string widgetType)
        {
            Type wt = Type.GetType("www.Areas.wall.Models.WidgetTypes." + widgetType);
            if (wt == null)
                throw new ArgumentException("Unknown widget type.");

            return Activator.CreateInstance(wt) as Widget;
        }


        public static WidgetsParamDTO[] ToDTOType(this IEnumerable<WidgetsParam> wp)
        {
            return wp.Select(param => param.ToDTOType()).ToArray();
        }

        public static WidgetsParamDTO ToDTOType(this WidgetsParam wp)
        {
            return new WidgetsParamDTO
            {
                // ReSharper disable once PossibleInvalidOperationException
                WidgetParamUID = wp.WidgetParamUID.Value,
                WidgetParamName = wp.WidgetParamName,
                WidgetParamValue = wp.WidgetParamValue.ToString()
            };
        }

        public static ColumnCustomizationDTO[] ToDTOType(this IEnumerable<ColumnCustomizationInfo> wp)
        {
            return wp.Select(param => param.ToDTOType()).ToArray();
        }

        public static ColumnCustomizationDTO ToDTOType(this ColumnCustomizationInfo wp)
        {
            var dto = (ColumnCustomizationDTO)new ColumnCustomizationDTO().InjectFrom(wp);
            // ReSharper disable once PossibleInvalidOperationException
            dto.QueryCustomizationUID = wp.QueryCustomizationUID.Value;

            return dto;
        }

        public static VitrinaDecorationInfoDTO ToDTOType(this VitrinaDecorationInfo wp)
        {
            var dto = (VitrinaDecorationInfoDTO)new VitrinaDecorationInfoDTO().InjectFrom(wp);
            return dto;
        }

        public static LegendInfoDTO ToDTOType(this LegendInfo wp)
        {
            var dto = (LegendInfoDTO)new LegendInfoDTO().InjectFrom(wp);

            return dto;
        }

        public static LegendItemInfoDTO ToDTOType(this LegendItemInfo wp)
        {
            var dto = (LegendItemInfoDTO)new LegendItemInfoDTO().InjectFrom(wp);
            // ReSharper disable once PossibleInvalidOperationException
            dto.LegendItemUID = wp.LegendItemUID.Value;

            return dto;
        }

        public static LegendItemInfoDTO[] ToDTOType(this IEnumerable<LegendItemInfo> wp)
        {
            return wp.Select(param => param.ToDTOType()).ToArray();
        }


        public static ReportItemInfoDTO ToDTOType(this ReportItemInfo wp)
        {
            var dto = (ReportItemInfoDTO)new ReportItemInfoDTO().InjectFrom(wp);
            // ReSharper disable once PossibleInvalidOperationException
            dto.UID = wp.UID.Value;

            return dto;
        }

        public static ReportItemInfoDTO[] ToDTOType(this IEnumerable<ReportItemInfo> wp)
        {
            return wp.Select(param => param.ToDTOType()).ToArray();
        }


        public static WidgetDTO ToDTOType(this Widget w, QueryDTO qryTemplate = null)
        {
            //string userID = WebSaUtilities.GetCurrentUserID();

            var mDTO = (WidgetDTO)new WidgetDTO().InjectFrom(w).InjectFrom(new
            {
                PlacementHeight = w.height,
                PlacementLeft = w.left,
                PlacementTop = w.top,
                PlacementWidth = w.width,
                RefreshInterval = w.timeUpdate,
                WidgetUID = w.id,
                Title = w.title,
                WidgetType = w.GetType().Name,
                ZIndex = w.zIndex,
                AutoRefresh = w.update
            });

            if (w.Decoration == null)
            {
                w.Decoration = new DecorationInfo();
            }

            string containerBackgroundVal = !String.IsNullOrWhiteSpace(w.Decoration.ContainerBackground) ? w.Decoration.ContainerBackground : null;
            string containerForegroundVal = !String.IsNullOrWhiteSpace(w.Decoration.ContainerForeground) ? w.Decoration.ContainerForeground : null;
            Color containerBackground = containerBackgroundVal != null ? Helper.Parse(Helper.ColorParseKind.rgba, containerBackgroundVal) : Color.White;
            Color containerForeground = containerForegroundVal != null ? Helper.Parse(Helper.ColorParseKind.rgba, containerForegroundVal) : Color.Black;

            var colorStates = Helper.ColorGenerateRolloverState(containerBackground, containerForeground);
            w.Decoration.ContainerBackground = Helper.Serialize(Helper.ColorParseKind.rgba, containerBackground);
            w.Decoration.ContainerForeground = Helper.Serialize(Helper.ColorParseKind.rgba, containerForeground);
            w.Decoration.ContainerBackgroundHover = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[0].Item1);
            w.Decoration.ContainerForegroundHover = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[0].Item2);
            w.Decoration.ContainerBackgroundVisited = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[1].Item1);
            w.Decoration.ContainerForegroundVisited = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[1].Item2);
            w.Decoration.ContainerBackgroundActive = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[2].Item1);
            w.Decoration.ContainerForegroundActive = Helper.Serialize(Helper.ColorParseKind.rgba, colorStates[2].Item2);

            mDTO.Decoration = new DecorationInfoDTO();
            mDTO.Decoration.InjectFrom(w.Decoration);
            
            /*
                        if (w.Legend != null)
                        {
                            mDTO.Legend = new LegendInfoDTO();
                            mDTO.Legend.InjectFrom<FastDeepCloneInjection>(w.Legend);
                        }
            */

            if (w is WidgetQuery wQuery)
            {
                if (qryTemplate == null && wQuery.GetType() != typeof(WidgetHtml))
                    throw new ArgumentException("qryTemplate parameter should be assigned when widget is WidgetQuery type.");

                if (qryTemplate != null)
                {
                    var queryDTO = new QueryDTO
                    {
                        Host = wQuery.requestParameters.domain,
                        QueryID = wQuery.requestParameters.rid,
                        SAQueryID = wQuery.requestParameters.requestid,
                        UseDefParams = wQuery.requestParameters.useDefParams ?? qryTemplate.UseDefParams,
                        ViewType = qryTemplate.ViewType,
                        PageSize = wQuery.requestParameters.pagesize,
                        ruleCode = wQuery.requestParameters.ruleCode ?? qryTemplate.ruleCode,
                        DatabaseID = qryTemplate.DatabaseID,
                        DatabaseName = qryTemplate.DatabaseName
                    };

                    List<QueryParamDTO> qParamsDTO = wQuery.requestParameters.parameters.ConvertAll(
                        item =>
                        {
                            string title = "";
                            if (!String.IsNullOrWhiteSpace(item.DisplayValue))
                                title = "¤" + item.DisplayValue;

                            var p = new QueryParamDTO
                            {
                                QueryParamName = item.Name,
                                QueryParamValues = item.ValueCombine("§") + title,
                                QueryParamID = (item.id ?? 0),
                                QueryParamTitle = item.Caption
                            };
                            return p;
                        });

                    queryDTO.Params = qParamsDTO;
                    mDTO.AddQuery(queryDTO);
                }
            }

            if (w is WidgetHtml wHtml)
            {
                mDTO.ContentHtml = wHtml.contentHtml;
            }

            if (w is WidgetSemNet wSemNet)
            {
                mDTO.SNLayout = wSemNet.SNLayout;
                mDTO.SNLevel = wSemNet.SNLevel;
                mDTO.SNStruct = wSemNet.SNStruct;
            }

            if (w is WidgetSource wSource)
            {
                mDTO.IsHtmlContent = wSource.isHtmlContent;
                mDTO.ContentProp = wSource.contentProp;
                mDTO.HideTitle = wSource.hideTitle;
                mDTO.HighlightMentionObj = wSource.highlightMentionObj;
                mDTO.ExtractOnlyMedia = wSource.extractOnlyMedia;
            }

            if (w is WidgetMap wMap)
            {
                /*устанавливаются через WidgetController.SetMapState
                mDTO.CenterLat = wMap.CenterLat;
                mDTO.CenterLong = wMap.CenterLong;
                mDTO.Zoom = wMap.Zoom;
                */
                mDTO.isClustered = wMap.isClustered;
            }

            if (w is WidgetTable wTable)
            {
                mDTO.isMarkSelectedItem = wTable.isMarkSelectedItem;
            }

            return mDTO;
        }

        public static QueryParamMapDTO ToDTOType(this QueryParamMap mLocal)
        {
            return (QueryParamMapDTO)new QueryParamMapDTO().InjectFrom(mLocal);
        }
    }
}